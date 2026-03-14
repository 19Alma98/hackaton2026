#!/usr/bin/env python3
"""Check peer connectivity across all nodes in the Geth Clique network.

Single-host (docker-compose with 5 services):
    uv run python blockchain/scripts/check_peers.py

Multi-PC LAN:
    uv run python blockchain/scripts/check_peers.py \\
        --hosts "IP1,IP2,IP3,IP4,IP5"

Exit code 0 when every node sees at least N-1 peers; non-zero otherwise.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request

DEFAULT_ENDPOINTS = [
    "http://localhost:8545",
    "http://localhost:8546",
    "http://localhost:8547",
    "http://localhost:8548",
    "http://localhost:8549",
]

TIMEOUT_S = 5


def rpc_call(url: str, method: str, params: list | None = None) -> dict:
    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params or [],
        "id": 1,
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
        return json.loads(resp.read())


def query_node(url: str) -> dict:
    """Return peer count, block number and peer details for one node."""
    result: dict = {"url": url, "ok": False}
    try:
        peer_count_resp = rpc_call(url, "net_peerCount")
        block_resp = rpc_call(url, "eth_blockNumber")
        peers_resp = rpc_call(url, "admin_peers")

        result["peer_count"] = int(peer_count_resp["result"], 16)
        result["block"] = int(block_resp["result"], 16)
        result["peers"] = [
            {
                "enode": p.get("enode", ""),
                "name": p.get("name", ""),
                "remote_addr": p.get("network", {}).get("remoteAddress", ""),
            }
            for p in peers_resp.get("result", [])
        ]
        result["ok"] = True
    except (urllib.error.URLError, KeyError, ValueError, OSError) as exc:
        result["error"] = str(exc)
    return result


def print_table(results: list[dict]) -> None:
    header = (
        f"{'Node':<8} {'Endpoint':<28} "
        f"{'Peers':>5}  {'Block':>8}  {'Status'}"
    )
    print(header)
    print("-" * len(header))
    for i, r in enumerate(results, 1):
        if r["ok"]:
            status = "OK"
            print(
                f"nodo{i:<4} {r['url']:<28} {r['peer_count']:>5}  "
                f"{r['block']:>8}  {status}"
            )
        else:
            print(
                f"nodo{i:<4} {r['url']:<28} {'–':>5}  {'–':>8}  "
                f"ERROR: {r.get('error', 'unknown')}"
            )


def print_peer_details(results: list[dict]) -> None:
    print("\n--- Peer details ---")
    for i, r in enumerate(results, 1):
        if not r["ok"] or not r.get("peers"):
            continue
        print(f"\nnodo{i} ({r['url']}):")
        for p in r["peers"]:
            remote = p["remote_addr"]
            enode_short = p["enode"][:40] + "..." if p["enode"] else "?"
            print(f"  -> {remote:<24} {enode_short}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--hosts",
        default=None,
        help=(
            "Comma-separated LAN IPs/hostnames (port 8545 assumed). "
            "When omitted, uses localhost:8545-8549."
        ),
    )
    parser.add_argument(
        "-q", "--quiet", action="store_true",
        help="Only print the summary table, skip peer details.",
    )
    args = parser.parse_args()

    if args.hosts:
        hosts = [h.strip() for h in args.hosts.split(",")]
        endpoints = [f"http://{h}:8545" for h in hosts]
    else:
        endpoints = DEFAULT_ENDPOINTS

    num_nodes = len(endpoints)
    results = [query_node(url) for url in endpoints]

    print_table(results)
    if not args.quiet:
        print_peer_details(results)

    ok_nodes = [r for r in results if r["ok"]]
    if not ok_nodes:
        print("\nNo reachable nodes!")
        sys.exit(2)

    all_connected = all(
        r["peer_count"] >= num_nodes - 1 for r in ok_nodes
    )
    blocks = [r["block"] for r in ok_nodes]
    block_spread = max(blocks) - min(blocks) if blocks else 0

    print(f"\nReachable: {len(ok_nodes)}/{num_nodes}")
    if block_spread > 2:
        print(
            f"WARNING: block spread = {block_spread} "
            "(nodes may be out of sync)"
        )

    if all_connected and len(ok_nodes) == num_nodes:
        print("All nodes fully connected.")
        sys.exit(0)
    else:
        under = [
            f"nodo{i + 1}" for i, r in enumerate(results)
            if r["ok"] and r["peer_count"] < num_nodes - 1
        ]
        unreachable = [
            f"nodo{i + 1}" for i, r in enumerate(results) if not r["ok"]
        ]
        if under:
            print(f"Under-peered: {', '.join(under)}")
        if unreachable:
            print(f"Unreachable:  {', '.join(unreachable)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
