#!/usr/bin/env python3
"""Generate deterministic node keys, keystores, genesis.json,
config.toml and static-nodes.json for a Geth Clique PoA network.

Usage (single host / Docker):
    uv run python blockchain/scripts/generate_keys.py

Usage (LAN – separate PCs):
    uv run python blockchain/scripts/generate_keys.py \
        --hosts "192.168.1.10,192.168.1.11,192.168.1.12"

Add a new node (same mnemonic, new IP; does not change genesis):
    uv run python blockchain/scripts/generate_keys.py add-node \
        --node-number 4 --host 192.168.1.14

All outputs are written under blockchain/.

To create additional wallets (e.g. the ente/organization wallet)
without regenerating node keys, use create_wallet.py instead.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from eth_account import Account
from eth_keys import keys as eth_keys

Account.enable_unaudited_hdwallet_features()

PROJECT_ROOT = Path(__file__).resolve().parent.parent  # blockchain/
NUM_NODES = 3
NODE_NAMES = [f"nodo{i}" for i in range(1, NUM_NODES + 1)]

DEFAULT_MNEMONIC = (
    "test test test test test test test test test test test junk"
)
DEFAULT_PASSWORD = "password"
DEFAULT_CHAIN_ID = 1337
DEFAULT_BLOCK_PERIOD = 5
CLIQUE_EPOCH = 30000
GAS_LIMIT = "0x1c9c380"  # 30 000 000
PREFUND_WEI = "0x21e19e0c9bab2400000"  # 10 000 ETH


def derive_accounts(mnemonic: str, count: int) -> list[dict]:
    """Derive *count* accounts from a BIP-39 mnemonic via BIP-44."""
    accounts = []
    for idx in range(count):
        path = f"m/44'/60'/0'/0/{idx}"
        acct = Account.from_mnemonic(mnemonic, account_path=path)
        pk = eth_keys.PrivateKey(acct.key)
        accounts.append(
            {
                "index": idx,
                "address": acct.address,
                "private_key": acct.key.hex(),
                "public_key": pk.public_key.to_hex(),
            }
        )
    return accounts


def write_node_dirs(accounts: list[dict], password: str) -> None:
    """Write keystore JSON and raw nodekey for each node."""
    for i, acct in enumerate(accounts):
        node_dir = PROJECT_ROOT / "nodes" / f"node{i + 1}"
        ks_dir = node_dir / "keystore"
        ks_dir.mkdir(parents=True, exist_ok=True)

        encrypted = Account.encrypt(acct["private_key"], password)
        addr_lower = acct["address"].lower().replace("0x", "")
        ks_path = ks_dir / f"UTC--node{i + 1}--{addr_lower}"
        ks_path.write_text(json.dumps(encrypted, indent=2))

        nodekey_path = node_dir / "nodekey"
        raw_hex = acct["private_key"]
        if raw_hex.startswith("0x"):
            raw_hex = raw_hex[2:]
        nodekey_path.write_text(raw_hex)


def build_extradata(addresses: list[str]) -> str:
    """Build the Clique genesis extradata field.

    Format: 32-byte vanity | N * 20-byte signer addresses | 65-byte seal
    """
    vanity = "0" * 64
    seal = "0" * 130
    signers = "".join(a.lower().replace("0x", "") for a in addresses)
    return f"0x{vanity}{signers}{seal}"


def build_genesis(
    accounts: list[dict], chain_id: int, period: int
) -> dict:
    genesis = {
        "config": {
            "chainId": chain_id,
            "homesteadBlock": 0,
            "eip150Block": 0,
            "eip155Block": 0,
            "eip158Block": 0,
            "byzantiumBlock": 0,
            "constantinopleBlock": 0,
            "petersburgBlock": 0,
            "istanbulBlock": 0,
            "berlinBlock": 0,
            "londonBlock": 0,
            "clique": {"period": period, "epoch": CLIQUE_EPOCH},
        },
        "difficulty": "1",
        "gasLimit": GAS_LIMIT,
        "extradata": build_extradata([a["address"] for a in accounts]),
        "alloc": {
            a["address"].lower(): {"balance": PREFUND_WEI}
            for a in accounts
        },
    }
    return genesis


def build_static_nodes(
    accounts: list[dict], hosts: list[str] | None = None
) -> list[str]:
    """Build enode URLs.

    *hosts* overrides the default Docker service names with LAN IPs (or
    any resolvable hostnames).  In the LAN scenario every node listens on
    port 30303 on its own machine, so no port offsetting is needed.
    """
    targets = hosts if hosts else NODE_NAMES
    enodes = []
    for i, acct in enumerate(accounts):
        pubkey = acct["public_key"]
        if pubkey.startswith("0x"):
            pubkey = pubkey[2:]
        enode = f"enode://{pubkey}@{targets[i]}:30303"
        enodes.append(enode)
    return enodes


def build_config_toml(enodes: list[str]) -> str:
    """Build a Geth config.toml with P2P static nodes."""
    quoted = ",\n    ".join(f'"{e}"' for e in enodes)
    return (
        "[Node.P2P]\n"
        f"StaticNodes = [\n    {quoted}\n]\n"
    )


def write_single_node_dir(
    node_number: int, account: dict, password: str
) -> None:
    """Write keystore and nodekey for a single node (e.g. node4)."""
    node_dir = PROJECT_ROOT / "nodes" / f"node{node_number}"
    ks_dir = node_dir / "keystore"
    ks_dir.mkdir(parents=True, exist_ok=True)

    encrypted = Account.encrypt(account["private_key"], password)
    addr_lower = account["address"].lower().replace("0x", "")
    ks_path = ks_dir / f"UTC--node{node_number}--{addr_lower}"
    ks_path.write_text(json.dumps(encrypted, indent=2))

    nodekey_path = node_dir / "nodekey"
    raw_hex = account["private_key"]
    if raw_hex.startswith("0x"):
        raw_hex = raw_hex[2:]
    nodekey_path.write_text(raw_hex)


def account_to_enode(account: dict, host: str, port: int = 30303) -> str:
    """Build enode URL for an account."""
    pubkey = account["public_key"]
    if pubkey.startswith("0x"):
        pubkey = pubkey[2:]
    return f"enode://{pubkey}@{host}:{port}"


def cmd_add_node(
    node_number: int,
    host: str,
    mnemonic: str = DEFAULT_MNEMONIC,
    password: str = DEFAULT_PASSWORD,
) -> None:
    """Add a new node: create its key dir and append enode to config/static-nodes."""
    if node_number < 1:
        raise ValueError("node_number must be >= 1")
    accounts = derive_accounts(mnemonic, node_number)
    account = accounts[node_number - 1]

    write_single_node_dir(node_number, account, password)
    enode = account_to_enode(account, host.strip())

    # Append to static-nodes.json
    static_path = PROJECT_ROOT / "static-nodes.json"
    if static_path.exists():
        current = json.loads(static_path.read_text())
        if not isinstance(current, list):
            current = []
    else:
        current = []
    if enode in current:
        print(f"Enode already in static-nodes.json: {enode[:50]}...")
    else:
        current.append(enode)
        static_path.write_text(json.dumps(current, indent=2) + "\n")
        print(f"Appended to static-nodes.json: {enode[:60]}...")

    # Keep config.toml in sync with static-nodes.json
    toml_path = PROJECT_ROOT / "config.toml"
    toml_path.write_text(build_config_toml(current))

    print(f"Created nodes/node{node_number}/ with address {account['address']}")
    print(f"Updated config.toml and static-nodes.json with enode @ {host}:30303")
    print()
    print("Next steps:")
    print(f"  1. Copy blockchain/ to the new PC (include nodes/node{node_number}/)")
    print("  2. On existing nodes: copy updated config.toml and static-nodes.json")
    print("     so they know the new peer, then restart geth if needed.")
    print(f"  3. On the new PC: NODE_NUM={node_number} NODE_ADDRESS={account['address']} \\")
    print("     docker compose -f docker-compose.node.yml up -d")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Command")

    # --- add-node ---
    add_parser = subparsers.add_parser("add-node", help="Add a new node (new IP); does not change genesis")
    add_parser.add_argument(
        "--node-number",
        type=int,
        required=True,
        help="Node number (e.g. 4 for the 4th node)",
    )
    add_parser.add_argument(
        "--host",
        required=True,
        help="IP or hostname of the new node (e.g. 192.168.1.14)",
    )
    add_parser.add_argument(
        "--mnemonic",
        default=DEFAULT_MNEMONIC,
        help="Same mnemonic used for existing nodes",
    )
    add_parser.add_argument(
        "--password", default=DEFAULT_PASSWORD, help="Keystore password",
    )

    # --- generate: options on main parser so "generate_keys.py --hosts ..." works ---
    parser.add_argument(
        "--mnemonic",
        default=DEFAULT_MNEMONIC,
        help="BIP-39 mnemonic for deterministic key derivation",
    )
    parser.add_argument("--chain-id", type=int, default=DEFAULT_CHAIN_ID)
    parser.add_argument("--period", type=int, default=DEFAULT_BLOCK_PERIOD)
    parser.add_argument(
        "--password", default=DEFAULT_PASSWORD, help="Keystore password"
    )
    parser.add_argument(
        "--hosts",
        default=None,
        help=(
            "Comma-separated list of LAN IPs/hostnames for the nodes "
            "(e.g. '192.168.1.10,192.168.1.11,...').  When omitted, Docker "
            "service names (nodo1..nodoN) are used."
        ),
    )

    args = parser.parse_args()

    if getattr(args, "command", None) == "add-node":
        cmd_add_node(
            node_number=args.node_number,
            host=args.host,
            mnemonic=args.mnemonic,
            password=args.password,
        )
        return

    # generate (default when no subcommand)
    hosts: list[str] | None = None
    if getattr(args, "hosts", None):
        hosts = [h.strip() for h in args.hosts.split(",")]
        if len(hosts) != NUM_NODES:
            parser.error(
                f"--hosts requires exactly {NUM_NODES} entries, "
                f"got {len(hosts)}"
            )

    print(f"Mnemonic : {args.mnemonic}")
    print(f"Chain ID : {args.chain_id}")
    print(f"Period   : {args.period}s")
    if hosts:
        print(f"Hosts    : {', '.join(hosts)}")
    else:
        print(f"Hosts    : Docker service names ({', '.join(NODE_NAMES)})")
    print()

    node_accounts = derive_accounts(args.mnemonic, NUM_NODES)

    # -- Node directories (keystores + nodekeys) --
    write_node_dirs(node_accounts, args.password)

    # -- genesis.json --
    genesis = build_genesis(
        node_accounts, args.chain_id, args.period,
    )
    genesis_path = PROJECT_ROOT / "genesis.json"
    genesis_path.write_text(json.dumps(genesis, indent=2) + "\n")

    # -- static-nodes.json (kept for reference) --
    static_nodes = build_static_nodes(node_accounts, hosts)
    static_path = PROJECT_ROOT / "static-nodes.json"
    static_path.write_text(json.dumps(static_nodes, indent=2) + "\n")

    # -- config.toml (used by Geth for peer discovery) --
    toml_content = build_config_toml(static_nodes)
    toml_path = PROJECT_ROOT / "config.toml"
    toml_path.write_text(toml_content)

    # -- password.txt --
    pw_path = PROJECT_ROOT / "password.txt"
    pw_path.write_text(args.password + "\n")

    # -- summary --
    targets = hosts if hosts else NODE_NAMES
    print("=== Generated node keys ===")
    for acct in node_accounts:
        pubhex = acct["public_key"]
        if pubhex.startswith("0x"):
            pubhex = pubhex[2:]
        node_num = acct["index"] + 1
        host = targets[acct["index"]]
        print(
            f"  Node {node_num}: {acct['address']}"
            f"  enode://{pubhex[:16]}...@{host}:30303"
        )

    print()
    print(f"genesis.json       -> {genesis_path}")
    print(f"config.toml        -> {toml_path}")
    print(f"static-nodes.json  -> {static_path}")
    print(f"password.txt       -> {pw_path}")
    print(f"Node dirs          -> {PROJECT_ROOT / 'nodes/'}")
    print()
    print("Next steps:")
    print("  1. cd blockchain && docker compose up -d")
    print("  2. Create wallets with create_wallet.py")


if __name__ == "__main__":
    main()
