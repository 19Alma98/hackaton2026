#!/usr/bin/env python3
"""Transfer ETH from a funded account to another address on the
private Geth Clique network.

Primary use case: fund the ente (organization) wallet when genesis
was initialised without its allocation, or top up its balance.

Usage (fund ente from node 1, reading keys from generated files):
    uv run python blockchain/scripts/fund_wallet.py

Usage (explicit parameters):
    uv run python blockchain/scripts/fund_wallet.py \
        --rpc http://192.168.2.208:8545 \
        --from-key 0xac0974...  \
        --to 0x90F79bf6EB2c4f870365E785982E1f101E93b906 \
        --amount 100

All amounts are in ETH (not wei).
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from pathlib import Path

from eth_account import Account

PROJECT_ROOT = Path(__file__).resolve().parent.parent  # blockchain/
DEFAULT_RPC = "http://localhost:8545"
DEFAULT_AMOUNT_ETH = 100.0
DEFAULT_CHAIN_ID = 1337
TIMEOUT_S = 15


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


def load_node1_key() -> str:
    """Read the private key of node 1 from the generated nodekey file."""
    nodekey_path = PROJECT_ROOT / "nodes" / "node1" / "nodekey"
    if not nodekey_path.exists():
        return ""
    raw = nodekey_path.read_text().strip()
    if not raw.startswith("0x"):
        raw = "0x" + raw
    return raw


def load_ente_address() -> str:
    """Read the ente address from wallets/ente.json (or legacy path)."""
    for candidate in (
        PROJECT_ROOT / "wallets" / "ente.json",
        PROJECT_ROOT / "ente_wallet.json",
    ):
        if candidate.exists():
            data = json.loads(candidate.read_text())
            return data.get("address", "")
    return ""


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--rpc", default=DEFAULT_RPC,
        help=f"JSON-RPC endpoint (default: {DEFAULT_RPC})",
    )
    parser.add_argument(
        "--from-key",
        default=None,
        help=(
            "Private key of the sender (hex). "
            "Defaults to node 1's key from blockchain/nodes/node1/nodekey."
        ),
    )
    parser.add_argument(
        "--to",
        default=None,
        help=(
            "Recipient address. "
            "Defaults to the ente address from blockchain/ente_wallet.json."
        ),
    )
    parser.add_argument(
        "--amount",
        type=float,
        default=DEFAULT_AMOUNT_ETH,
        help=f"Amount to transfer in ETH (default: {DEFAULT_AMOUNT_ETH})",
    )
    parser.add_argument(
        "--chain-id",
        type=int,
        default=DEFAULT_CHAIN_ID,
        help=f"Chain ID for EIP-155 signing (default: {DEFAULT_CHAIN_ID})",
    )
    args = parser.parse_args()

    from_key = args.from_key or load_node1_key()
    if not from_key:
        print(
            "ERROR: no sender key available. Either pass --from-key or "
            "run generate_keys.py first.",
            file=sys.stderr,
        )
        sys.exit(1)

    to_address = args.to or load_ente_address()
    if not to_address:
        print(
            "ERROR: no recipient address. Either pass --to or "
            "run generate_keys.py first (generates ente_wallet.json).",
            file=sys.stderr,
        )
        sys.exit(1)

    sender = Account.from_key(from_key)
    value_wei = int(args.amount * 10**18)

    print(f"RPC      : {args.rpc}")
    print(f"From     : {sender.address}")
    print(f"To       : {to_address}")
    print(f"Amount   : {args.amount} ETH ({value_wei} wei)")
    print(f"Chain ID : {args.chain_id}")
    print()

    nonce_resp = rpc(
        args.rpc, "eth_getTransactionCount",
        [sender.address, "latest"],
    )
    nonce = hex_to_int(nonce_resp["result"])

    gas_price_resp = rpc(args.rpc, "eth_gasPrice")
    gas_price = hex_to_int(gas_price_resp["result"])

    tx = {
        "nonce": nonce,
        "to": to_address,
        "value": value_wei,
        "gas": 21_000,
        "gasPrice": gas_price,
        "chainId": args.chain_id,
    }

    signed = Account.sign_transaction(tx, from_key)
    raw_hex = "0x" + signed.raw_transaction.hex()

    print("Sending transaction ...")
    send_resp = rpc(args.rpc, "eth_sendRawTransaction", [raw_hex])

    if "error" in send_resp:
        print(f"ERROR: {send_resp['error']}", file=sys.stderr)
        sys.exit(1)

    tx_hash = send_resp["result"]
    print(f"Tx hash  : {tx_hash}")

    print("Waiting for receipt ...")
    import time
    for _ in range(60):
        receipt_resp = rpc(args.rpc, "eth_getTransactionReceipt", [tx_hash])
        receipt = receipt_resp.get("result")
        if receipt:
            status = hex_to_int(receipt.get("status", "0x0"))
            gas_used = hex_to_int(receipt.get("gasUsed", "0x0"))
            if status == 1:
                print(
                    f"SUCCESS  : {args.amount} ETH sent"
                    f" (gas used: {gas_used})"
                )
            else:
                print(f"FAILED   : tx reverted (gas used: {gas_used})")
                sys.exit(1)
            break
        time.sleep(1)
    else:
        print(
            "WARNING: receipt not found after 60s"
            " – tx may still be pending."
        )

    bal_resp = rpc(args.rpc, "eth_getBalance", [to_address, "latest"])
    bal_eth = hex_to_int(bal_resp["result"]) / 10**18
    print(f"Balance  : {to_address} now has {bal_eth:,.4f} ETH")


if __name__ == "__main__":
    main()
