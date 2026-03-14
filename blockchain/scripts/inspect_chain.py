#!/usr/bin/env python3
"""Inspect the private Geth Clique blockchain: balances, contracts, tokens.

Single-host (all nodes on one PC):
    uv run python blockchain/scripts/inspect_chain.py

Multi-PC LAN (query a specific node):
    uv run python blockchain/scripts/inspect_chain.py --rpc http://192.168.2.208:8545

Show only balances (skip full block scan):
    uv run python blockchain/scripts/inspect_chain.py --balances-only
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field

# Fallback se test_accounts.json non è disponibile
KNOWN_ACCOUNTS_DEFAULT = {
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": "Nodo 1 (Ale M)",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": "Nodo 2 (Ale Z)",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC": "Nodo 3 (Robert)",
}


def _load_known_accounts() -> dict[str, str]:
    """Carica gli account da blockchain/wallets/test_accounts.json se esiste."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # blockchain/scripts -> blockchain/wallets/test_accounts.json
    wallets_dir = os.path.join(os.path.dirname(script_dir), "wallets")
    path = os.path.join(wallets_dir, "test_accounts.json")
    if not os.path.isfile(path):
        return dict(KNOWN_ACCOUNTS_DEFAULT)
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        accounts = data.get("accounts") or []
        return {a["address"]: a.get("name", a["address"]) for a in accounts if a.get("address")}
    except (json.JSONDecodeError, KeyError):
        return dict(KNOWN_ACCOUNTS_DEFAULT)


def get_known_accounts() -> dict[str, str]:
    """Lazy load degli account (per evitare dipendenze da path al import)."""
    if not hasattr(get_known_accounts, "_cache"):
        get_known_accounts._cache = _load_known_accounts()  # type: ignore[attr-defined]
    return get_known_accounts._cache  # type: ignore[attr-defined]

ERC721_ABI_FRAGMENTS = [
    {"constant": True, "inputs": [], "name": "name",
     "outputs": [{"name": "", "type": "string"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "symbol",
     "outputs": [{"name": "", "type": "string"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "totalSupply",
     "outputs": [{"name": "", "type": "uint256"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "owner", "type": "address"}],
     "name": "balanceOf",
     "outputs": [{"name": "", "type": "uint256"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "owner",
     "outputs": [{"name": "", "type": "address"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "index", "type": "uint256"}],
     "name": "tokenByIndex",
     "outputs": [{"name": "", "type": "uint256"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "tokenId", "type": "uint256"}],
     "name": "ownerOf",
     "outputs": [{"name": "", "type": "address"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "owner", "type": "address"},
                                   {"name": "index", "type": "uint256"}],
     "name": "tokenOfOwnerByIndex",
     "outputs": [{"name": "", "type": "uint256"}], "type": "function"},
]

TIMEOUT_S = 10
SEP = "=" * 70


def rpc(url: str, method: str, params: list | None = None) -> dict:
    payload = json.dumps({
        "jsonrpc": "2.0", "method": method,
        "params": params or [], "id": 1,
    }).encode()
    req = urllib.request.Request(
        url, data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
        return json.loads(resp.read())


def hex_to_int(h: str) -> int:
    return int(h, 16)


def wei_to_eth(wei: int) -> float:
    return wei / 10**18


def label(address: str) -> str:
    for known, name in get_known_accounts().items():
        if known.lower() == address.lower():
            return name
    return address


@dataclass
class ContractInfo:
    address: str
    deployer: str
    block: int
    code_size: int
    name: str = ""
    symbol: str = ""
    total_supply: int = 0
    owner: str = ""
    token_holders: dict[str, list[int]] = field(default_factory=dict)


@dataclass
class TxInfo:
    block: int
    tx_hash: str
    from_addr: str
    to_addr: str
    value_wei: int
    gas_used: int
    status: int
    log_count: int
    is_deploy: bool


def print_header(title: str) -> None:
    print(f"\n{SEP}")
    print(f"  {title}")
    print(SEP)


def collect_addresses_from_chain(rpc_url: str, quiet: bool = False) -> list[str]:
    """Deriva dalla chain tutti gli indirizzi che compaiono in transazioni o deploy."""
    block_hex = rpc(rpc_url, "eth_blockNumber")["result"]
    latest = hex_to_int(block_hex)
    seen: set[str] = set()
    progress_step = max(1, latest // 20) if latest else 1
    if not quiet:
        print(f"\n  Raccolta indirizzi dalla chain (blocchi 0..{latest}) ", end="", flush=True)
    for b in range(latest + 1):
        if not quiet and b % progress_step == 0:
            print(".", end="", flush=True)
        block_resp = rpc(rpc_url, "eth_getBlockByNumber", [hex(b), True])
        block = block_resp.get("result")
        if not block:
            continue
        for tx in block.get("transactions", []):
            from_addr = tx.get("from")
            to_addr = tx.get("to")
            if from_addr:
                seen.add(from_addr)
            if to_addr:
                seen.add(to_addr)
            if to_addr is None:
                receipt_resp = rpc(rpc_url, "eth_getTransactionReceipt", [tx["hash"]])
                contract_addr = (receipt_resp.get("result") or {}).get("contractAddress")
                if contract_addr:
                    seen.add(contract_addr)
    if not quiet:
        print(" fatto!")
    return sorted(seen)


def fetch_balances(rpc_url: str, addresses: list[str] | None = None) -> None:
    """Mostra i bilanci ETH. Se addresses è None, li deriva dalla chain (transazioni e deploy)."""
    if addresses is None:
        addresses = collect_addresses_from_chain(rpc_url, quiet=False)
    if not addresses:
        addresses = list(get_known_accounts().keys())
    print_header("BILANCI ETH")
    fmt = "  {:<44} {:>14} ETH"
    print(fmt.format("Indirizzo", "Bilancio"))
    print("  " + "-" * 60)
    for addr in addresses:
        try:
            resp = rpc(rpc_url, "eth_getBalance", [addr, "latest"])
            bal = wei_to_eth(hex_to_int(resp["result"]))
            print(fmt.format(addr, f"{bal:,.4f}"))
        except Exception:
            print(fmt.format(addr, "N/A"))


def scan_blocks(rpc_url: str) -> tuple[list[ContractInfo], list[TxInfo], list[str]]:
    block_hex = rpc(rpc_url, "eth_blockNumber")["result"]
    latest = hex_to_int(block_hex)
    print(f"\n  Blocco corrente: {latest}")
    print(f"  Scansione blocchi 0..{latest} ", end="", flush=True)

    contracts: list[ContractInfo] = []
    txs: list[TxInfo] = []
    addresses_seen: set[str] = set()
    progress_step = max(1, latest // 20)

    for b in range(latest + 1):
        if b % progress_step == 0:
            print(".", end="", flush=True)
        block_resp = rpc(rpc_url, "eth_getBlockByNumber", [hex(b), True])
        block = block_resp.get("result")
        if not block:
            continue
        for tx in block.get("transactions", []):
            tx_hash = tx["hash"]
            receipt_resp = rpc(rpc_url, "eth_getTransactionReceipt", [tx_hash])
            receipt = receipt_resp.get("result", {})
            if not receipt:
                continue

            from_addr = tx["from"]
            to_addr = tx.get("to")
            contract_addr = receipt.get("contractAddress", "")
            addresses_seen.add(from_addr)
            if to_addr:
                addresses_seen.add(to_addr)
            if contract_addr:
                addresses_seen.add(contract_addr)

            gas_used = hex_to_int(receipt.get("gasUsed", "0x0"))
            status = hex_to_int(receipt.get("status", "0x1"))
            logs = receipt.get("logs", [])

            is_deploy = to_addr is None
            if is_deploy:
                code_resp = rpc(rpc_url, "eth_getCode", [contract_addr, "latest"])
                code_hex = code_resp.get("result", "0x")
                code_size = max(0, (len(code_hex) - 2) // 2)
                contracts.append(ContractInfo(
                    address=contract_addr,
                    deployer=from_addr,
                    block=b,
                    code_size=code_size,
                ))

            txs.append(TxInfo(
                block=b,
                tx_hash=tx_hash,
                from_addr=from_addr,
                to_addr=to_addr or contract_addr,
                value_wei=hex_to_int(tx.get("value", "0x0")),
                gas_used=gas_used,
                status=status,
                log_count=len(logs),
                is_deploy=is_deploy,
            ))

    print(" fatto!")
    return contracts, txs, sorted(addresses_seen)


def enrich_contracts(rpc_url: str, contracts: list[ContractInfo]) -> None:
    """Try to read ERC721 metadata from each contract via eth_call."""
    for c in contracts:
        try:
            c.name = _call_string(rpc_url, c.address, "name()")
            c.symbol = _call_string(rpc_url, c.address, "symbol()")
            c.total_supply = _call_uint(rpc_url, c.address, "totalSupply()")
            c.owner = _call_address(rpc_url, c.address, "owner()")
        except Exception:
            pass

        if c.total_supply > 0:
            _fetch_token_owners(rpc_url, c)


def _keccak_selector(sig: str) -> str:
    """Compute 4-byte function selector via the node's web3_sha3."""
    # We can ask the node itself for the keccak hash
    import hashlib
    # Use a pure-python keccak if available, otherwise fall back to rpc
    try:
        from hashlib import sha3_256  # noqa: F811
        # Python's sha3_256 is NOT keccak256; use rpc instead
        raise ImportError
    except ImportError:
        pass
    resp = rpc("", "web3_sha3", ["0x" + sig.encode().hex()])
    return resp["result"][:10]


def _eth_call(rpc_url: str, to: str, data: str) -> str:
    resp = rpc(rpc_url, "eth_call", [{"to": to, "data": data}, "latest"])
    return resp.get("result", "0x")


def _selector(signature: str) -> str:
    """Compute keccak256 selector locally without external deps."""
    import struct
    # Minimal keccak-256 via pysha3 or hashlib or the RPC node
    try:
        import sha3  # type: ignore
        k = sha3.keccak_256(signature.encode()).hexdigest()
        return "0x" + k[:8]
    except ImportError:
        pass
    # Fallback: ask the geth node
    hex_input = "0x" + signature.encode("utf-8").hex()
    # We need the rpc_url but don't have it here; use a global
    resp = rpc(_CURRENT_RPC, "web3_sha3", [hex_input])
    return resp["result"][:10]


_CURRENT_RPC = ""

# Pre-computed selectors (keccak256 of the function signature, first 4 bytes)
SEL_NAME = "0x06fdde03"           # name()
SEL_SYMBOL = "0x95d89b41"         # symbol()
SEL_TOTAL_SUPPLY = "0x18160ddd"   # totalSupply()
SEL_OWNER = "0x8da5cb5b"          # owner()
SEL_BALANCE_OF = "0x70a08231"     # balanceOf(address)
SEL_TOKEN_BY_INDEX = "0x4f6ccce7" # tokenByIndex(uint256)
SEL_OWNER_OF = "0x6352211e"       # ownerOf(uint256)


def _call_string(rpc_url: str, to: str, _sig: str) -> str:
    sel = {"name()": SEL_NAME, "symbol()": SEL_SYMBOL}.get(_sig, "0x")
    raw = _eth_call(rpc_url, to, sel)
    if raw == "0x" or len(raw) < 130:
        return ""
    # ABI-decode: offset (32b) + length (32b) + data
    length = int(raw[66:130], 16)
    hex_str = raw[130:130 + length * 2]
    return bytes.fromhex(hex_str).decode("utf-8", errors="replace")


def _call_uint(rpc_url: str, to: str, _sig: str) -> int:
    sel = {"totalSupply()": SEL_TOTAL_SUPPLY}.get(_sig, "0x")
    raw = _eth_call(rpc_url, to, sel)
    if raw == "0x" or len(raw) < 66:
        return 0
    return int(raw[2:66], 16)


def _call_address(rpc_url: str, to: str, _sig: str) -> str:
    sel = {"owner()": SEL_OWNER}.get(_sig, "0x")
    raw = _eth_call(rpc_url, to, sel)
    if raw == "0x" or len(raw) < 66:
        return ""
    return "0x" + raw[26:66]


def _fetch_token_owners(rpc_url: str, c: ContractInfo) -> None:
    """For ERC721Enumerable, list all tokens and their owners."""
    for i in range(min(c.total_supply, 100)):
        try:
            idx_hex = hex(i)[2:].zfill(64)
            raw = _eth_call(rpc_url, c.address, SEL_TOKEN_BY_INDEX + idx_hex)
            token_id = int(raw[2:], 16) if raw != "0x" else -1
            if token_id < 0:
                continue

            tid_hex = hex(token_id)[2:].zfill(64)
            owner_raw = _eth_call(rpc_url, c.address, SEL_OWNER_OF + tid_hex)
            owner_addr = "0x" + owner_raw[26:66] if len(owner_raw) >= 66 else "?"

            owner_label = label(owner_addr)
            c.token_holders.setdefault(owner_label, []).append(token_id)
        except Exception:
            break


def print_contracts(contracts: list[ContractInfo]) -> None:
    contract_addrs = {c.address.lower() for c in contracts}
    print_header(f"SMART CONTRACT DEPLOYATI ({len(contracts)})")
    if not contracts:
        print("  Nessun contratto trovato sulla chain.")
        return

    for i, c in enumerate(contracts, 1):
        deployer = label(c.deployer)
        owner = label(c.owner) if c.owner else "N/A"
        print(f"\n  Contratto #{i}")
        print(f"  {'Indirizzo:':<16} {c.address}")
        print(f"  {'Deployer:':<16} {deployer}")
        print(f"  {'Blocco:':<16} {c.block}")
        print(f"  {'Code size:':<16} {c.code_size} bytes")
        if c.name:
            print(f"  {'Token Name:':<16} {c.name} ({c.symbol})")
            print(f"  {'Total Supply:':<16} {c.total_supply}")
            print(f"  {'Owner:':<16} {owner}")
        if c.token_holders:
            print(f"  Token holders:")
            for holder, ids in c.token_holders.items():
                ids_str = ", ".join(f"#{tid}" for tid in sorted(ids))
                print(f"    {holder}: {len(ids)} token [{ids_str}]")
        elif c.name and c.total_supply == 0:
            print(f"  (nessun token mintato)")


def print_transactions(txs: list[TxInfo], contracts: list[ContractInfo]) -> None:
    contract_addrs = {c.address.lower() for c in contracts}
    print_header(f"STORICO TRANSAZIONI ({len(txs)})")
    if not txs:
        print("  Nessuna transazione trovata.")
        return

    for t in txs:
        from_name = label(t.from_addr)
        to_name = label(t.to_addr)
        status = "OK" if t.status == 1 else "FAIL"
        value_eth = wei_to_eth(t.value_wei)

        if t.is_deploy:
            tx_type = "DEPLOY"
        elif t.to_addr.lower() in contract_addrs:
            tx_type = "CONTRACT CALL"
        elif t.value_wei > 0:
            tx_type = "TRANSFER"
        else:
            tx_type = "CALL"

        print(f"\n  Block {t.block} | {tx_type} | {status}")
        print(f"    Da:    {from_name}")
        print(f"    A:     {to_name}")
        if value_eth > 0:
            print(f"    Valore: {value_eth:.4f} ETH")
        print(f"    Gas:   {t.gas_used} | Events: {t.log_count}")
        print(f"    Tx:    {t.tx_hash}")


def main() -> None:
    global _CURRENT_RPC

    parser = argparse.ArgumentParser(
        description="Inspect the private Geth Clique blockchain.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--rpc", default="http://localhost:8545",
        help="JSON-RPC endpoint (default: http://localhost:8545)",
    )
    parser.add_argument(
        "--balances-only", action="store_true",
        help="Show only ETH balances, skip block scanning.",
    )
    args = parser.parse_args()

    _CURRENT_RPC = args.rpc

    print(f"\n  RPC endpoint: {args.rpc}")

    try:
        chain_resp = rpc(args.rpc, "eth_chainId")
        chain_id = hex_to_int(chain_resp["result"])
        print(f"  Chain ID:     {chain_id}")
    except Exception as e:
        print(f"\n  ERRORE: impossibile connettersi a {args.rpc}")
        print(f"  Dettaglio: {e}")
        sys.exit(1)

    if args.balances_only:
        fetch_balances(args.rpc)
        print()
        return

    print_header("SCANSIONE BLOCKCHAIN")
    contracts, txs, addresses = scan_blocks(args.rpc)
    fetch_balances(args.rpc, addresses=addresses)

    if contracts:
        print("\n  Analisi token in corso...", end=" ", flush=True)
        enrich_contracts(args.rpc, contracts)
        print("fatto!")

    print_contracts(contracts)
    print_transactions(txs, contracts)
    print()


if __name__ == "__main__":
    main()
