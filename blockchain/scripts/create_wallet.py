#!/usr/bin/env python3
"""Create a new Ethereum wallet without regenerating existing keys.

The wallet can be derived from the project mnemonic (at a chosen
index) or generated randomly.  The result is saved to
blockchain/wallets/<name>.json and optionally funded via an
on-chain ETH transfer.

Usage (random wallet):
    uv run python blockchain/scripts/create_wallet.py alice

Usage (deterministic, mnemonic index 10):
    uv run python blockchain/scripts/create_wallet.py alice --index 10

Usage (create + add to genesis alloc, before chain start):
    uv run python blockchain/scripts/create_wallet.py ente \
        --index 3 --genesis

Usage (create + fund 50 ETH, after chain start):
    uv run python blockchain/scripts/create_wallet.py alice --fund 50

Usage (fund from a specific account instead of node 1):
    uv run python blockchain/scripts/create_wallet.py alice \
        --fund 50 --from-key 0xac0974...

Usage (create + fund, custom RPC):
    uv run python blockchain/scripts/create_wallet.py alice \
        --fund 200 --rpc http://192.168.2.208:8545

List existing wallets:
    uv run python blockchain/scripts/create_wallet.py --list
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

from eth_account import Account

Account.enable_unaudited_hdwallet_features()

PROJECT_ROOT = Path(__file__).resolve().parent.parent  # blockchain/
WALLETS_DIR = PROJECT_ROOT / "wallets"

DEFAULT_MNEMONIC = (
    "test test test test test test test test test test test junk"
)
DEFAULT_PASSWORD = "password"
DEFAULT_RPC = "http://localhost:8545"
DEFAULT_CHAIN_ID = 1337
PREFUND_WEI = "0x21e19e0c9bab2400000"  # 10 000 ETH
TIMEOUT_S = 15


# ── JSON-RPC helpers (same pattern as fund_wallet.py) ──────────


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


def load_node_key(node: int = 1) -> str:
    """Load the private key of *node* (1-based) from its nodekey file."""
    nodekey_path = (
        PROJECT_ROOT / "nodes" / f"node{node}" / "nodekey"
    )
    if not nodekey_path.exists():
        return ""
    raw = nodekey_path.read_text().strip()
    if not raw.startswith("0x"):
        raw = "0x" + raw
    return raw


# ── Wallet creation ────────────────────────────────────────────


def create_from_mnemonic(index: int) -> dict:
    path = f"m/44'/60'/0'/0/{index}"
    acct = Account.from_mnemonic(DEFAULT_MNEMONIC, account_path=path)
    return {
        "address": acct.address,
        "private_key": acct.key.hex(),
        "source": "mnemonic",
        "derivation_index": index,
    }


def create_random() -> dict:
    acct = Account.create()
    return {
        "address": acct.address,
        "private_key": acct.key.hex(),
        "source": "random",
    }


def save_wallet(name: str, info: dict) -> Path:
    WALLETS_DIR.mkdir(parents=True, exist_ok=True)

    ks_dir = WALLETS_DIR / name / "keystore"
    ks_dir.mkdir(parents=True, exist_ok=True)
    encrypted = Account.encrypt(
        info["private_key"], DEFAULT_PASSWORD,
    )
    addr_lower = info["address"].lower().replace("0x", "")
    ks_path = ks_dir / f"UTC--{name}--{addr_lower}"
    ks_path.write_text(json.dumps(encrypted, indent=2))

    wallet_file = WALLETS_DIR / f"{name}.json"
    wallet_file.write_text(json.dumps({
        "name": name,
        "address": info["address"],
        "private_key": info["private_key"],
        "keystore": str(ks_path),
        **{k: v for k, v in info.items()
           if k not in ("address", "private_key")},
    }, indent=2) + "\n")
    return wallet_file


# ── Genesis patching ───────────────────────────────────────────


def patch_genesis(address: str) -> bool:
    """Add *address* to the existing genesis.json alloc.

    Returns True on success.  The genesis file is updated in place;
    node keys and extradata are NOT touched.
    """
    genesis_path = PROJECT_ROOT / "genesis.json"
    if not genesis_path.exists():
        print(
            "  genesis.json not found – run "
            "generate_keys.py first.",
            file=sys.stderr,
        )
        return False

    genesis = json.loads(genesis_path.read_text())
    alloc = genesis.setdefault("alloc", {})
    key = address.lower()
    if key.startswith("0x"):
        key = key[2:]
    # genesis keys are stored without 0x by convention
    # but some may have it – normalise to lowercase with 0x
    # to match the existing style in this project
    key = address.lower()

    if key in alloc:
        print(f"  Address already in genesis alloc.")
        return True

    alloc[key] = {"balance": PREFUND_WEI}
    genesis_path.write_text(
        json.dumps(genesis, indent=2) + "\n"
    )
    print(f"  Added to genesis alloc (10 000 ETH)")
    return True


# ── Funding ────────────────────────────────────────────────────


def fund(
    rpc_url: str,
    to_address: str,
    amount_eth: float,
    chain_id: int,
    from_key: str | None = None,
) -> None:
    key = from_key or load_node_key(1)
    if not key:
        print(
            "Cannot fund: no sender key. Pass --from-key "
            "or run generate_keys.py first.",
            file=sys.stderr,
        )
        return

    sender = Account.from_key(key)
    value_wei = int(amount_eth * 10**18)

    nonce_resp = rpc(
        rpc_url, "eth_getTransactionCount",
        [sender.address, "latest"],
    )
    nonce = hex_to_int(nonce_resp["result"])

    gas_price_resp = rpc(rpc_url, "eth_gasPrice")
    gas_price = hex_to_int(gas_price_resp["result"])

    tx = {
        "nonce": nonce,
        "to": to_address,
        "value": value_wei,
        "gas": 21_000,
        "gasPrice": gas_price,
        "chainId": chain_id,
    }

    signed = Account.sign_transaction(tx, key)
    raw_hex = "0x" + signed.raw_transaction.hex()

    send_resp = rpc(rpc_url, "eth_sendRawTransaction", [raw_hex])
    if "error" in send_resp:
        print(f"Funding failed: {send_resp['error']}", file=sys.stderr)
        return

    tx_hash = send_resp["result"]
    print(f"  Funding tx: {tx_hash}")

    for _ in range(60):
        receipt = rpc(
            rpc_url, "eth_getTransactionReceipt", [tx_hash],
        ).get("result")
        if receipt:
            status = hex_to_int(receipt.get("status", "0x0"))
            if status == 1:
                print(f"  Funded {amount_eth} ETH OK")
            else:
                print("  Funding tx reverted!", file=sys.stderr)
            return
        time.sleep(1)

    print("  Warning: receipt not found after 60 s")


# ── List ───────────────────────────────────────────────────────


def list_wallets() -> None:
    if not WALLETS_DIR.exists():
        print("No wallets created yet.")
        return

    files = sorted(WALLETS_DIR.glob("*.json"))
    if not files:
        print("No wallets created yet.")
        return

    fmt = "  {:<16} {:<44} {}"
    print(fmt.format("Name", "Address", "Source"))
    print("  " + "-" * 70)
    for f in files:
        data = json.loads(f.read_text())
        source = data.get("source", "?")
        idx = data.get("derivation_index")
        if idx is not None:
            source += f" (index {idx})"
        print(fmt.format(
            data.get("name", f.stem),
            data.get("address", "?"),
            source,
        ))


# ── CLI ────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "name", nargs="?",
        help="Wallet name (used as filename and label).",
    )
    parser.add_argument(
        "--index", type=int, default=None,
        help=(
            "Derive from the project mnemonic at this "
            "BIP-44 index. If omitted, a random key is "
            "generated."
        ),
    )
    parser.add_argument(
        "--genesis", action="store_true",
        help=(
            "Add the wallet address to genesis.json alloc "
            "(10 000 ETH pre-fund). Use BEFORE starting the "
            "chain. Mutually exclusive with --fund."
        ),
    )
    parser.add_argument(
        "--fund", type=float, default=None, metavar="ETH",
        help=(
            "Fund the new wallet with this amount of ETH. "
            "Use AFTER chain is running."
        ),
    )
    parser.add_argument(
        "--from-key", default=None, metavar="HEX",
        help=(
            "Private key of the funding sender (hex). "
            "Defaults to node 1's key."
        ),
    )
    parser.add_argument(
        "--rpc", default=DEFAULT_RPC,
        help=f"JSON-RPC endpoint (default: {DEFAULT_RPC})",
    )
    parser.add_argument(
        "--chain-id", type=int, default=DEFAULT_CHAIN_ID,
    )
    parser.add_argument(
        "--list", action="store_true",
        help="List all previously created wallets.",
    )
    args = parser.parse_args()

    if args.list:
        list_wallets()
        return

    if not args.name:
        parser.error("wallet name is required (or use --list)")

    if args.genesis and args.fund is not None:
        parser.error(
            "--genesis and --fund are mutually exclusive. "
            "Use --genesis before chain start, "
            "--fund after."
        )

    wallet_file = WALLETS_DIR / f"{args.name}.json"
    if wallet_file.exists():
        print(
            f"Wallet '{args.name}' already exists: "
            f"{wallet_file}",
            file=sys.stderr,
        )
        sys.exit(1)

    if args.index is not None:
        info = create_from_mnemonic(args.index)
        print(
            f"Created wallet '{args.name}' "
            f"(mnemonic index {args.index})"
        )
    else:
        info = create_random()
        print(f"Created wallet '{args.name}' (random key)")

    path = save_wallet(args.name, info)
    print(f"  Address : {info['address']}")
    print(f"  File    : {path}")

    if args.genesis:
        patch_genesis(info["address"])

    if args.fund is not None and args.fund > 0:
        src = "custom key" if args.from_key else "node 1"
        print(f"  Funding {args.fund} ETH from {src} ...")
        fund(
            args.rpc, info["address"],
            args.fund, args.chain_id,
            from_key=args.from_key,
        )

    print()
    print("To import into Ape:")
    print(
        f"  uv run ape accounts import {args.name}"
    )
    print(
        f"  (paste private key from {path})"
    )


if __name__ == "__main__":
    main()
