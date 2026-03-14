"""
End-to-end marketplace demo: deploy → mint → list → buy between two wallets.

On the local test network the script deploys fresh contracts automatically.
On the private Geth chain it loads existing deployments from the JSON files.

Usage (local test network – fully automatic):
    uv run ape run marketplace_demo

Usage (private Geth network – provide account aliases):
    NODE1_ALIAS=node1 NODE2_ALIAS=node2 DEPLOYER_ALIAS=deployer \
        uv run ape run marketplace_demo --network ethereum:local:node

Usage (remote LAN node):
    RPC_URL=http://192.168.2.208:8545 NODE1_ALIAS=node1 NODE2_ALIAS=node2 \
        DEPLOYER_ALIAS=deployer uv run ape run marketplace_demo --network ethereum:local:node

Environment variables:
    RPC_URL         Override the Geth RPC endpoint (for LAN deployment)
    NODE1_ALIAS     Ape account alias for the ticket holder / seller
    NODE2_ALIAS     Ape account alias for the buyer
    DEPLOYER_ALIAS  Ape account alias for the contract owner (minter)
    TOKEN_ID        Token ID to mint (default: 9001)
    PRICE           Listing price in wei (default: 1 ETH = 10**18)
"""

import json
import os
from pathlib import Path

from ape import accounts, chain, Contract, project


DEPLOYMENTS_DIR = Path(__file__).resolve().parent.parent / "deployments"


def _load_contract(filename):
    path = DEPLOYMENTS_DIR / filename
    if not path.exists():
        return None
    data = json.loads(path.read_text())
    return Contract(data["address"], abi=data["abi"])


def _save_deployment(contract, filename, contract_name):
    DEPLOYMENTS_DIR.mkdir(exist_ok=True)
    out_file = DEPLOYMENTS_DIR / filename
    abi = [item.dict() for item in contract.contract_type.abi]
    payload = {
        "contract_name": contract_name,
        "address": contract.address,
        "abi": abi,
    }
    out_file.write_text(json.dumps(payload, indent=2))


def _load_account(env_var, fallback_index):
    alias = os.environ.get(env_var)
    if alias:
        return accounts.load(alias)
    acct = accounts.test_accounts[fallback_index]
    print(f"  {env_var} not set → test account [{fallback_index}]: {acct.address}")
    return acct


def _deploy_contracts(deployer):
    """Deploy fresh contracts and return (nft, marketplace)."""
    print("[0] Deploying contracts ...")
    nft = deployer.deploy(project.TicketNFT, "Hacka", "HAK")
    marketplace = deployer.deploy(project.TicketMarketplace, nft.address)
    _save_deployment(nft, "ticket_nft.json", "TicketNFT")
    _save_deployment(marketplace, "marketplace.json", "TicketMarketplace")
    print(f"    TicketNFT     @ {nft.address}")
    print(f"    Marketplace   @ {marketplace.address}")
    return nft, marketplace


def _load_or_deploy(deployer):
    """Try loading existing deployments; deploy fresh if that fails."""
    nft = _load_contract("ticket_nft.json")
    marketplace = _load_contract("marketplace.json")

    if nft is not None and marketplace is not None:
        try:
            nft.name()
            marketplace.nft()
            print(f"    TicketNFT     @ {nft.address}")
            print(f"    Marketplace   @ {marketplace.address}")
            return nft, marketplace
        except Exception:
            pass

    return _deploy_contracts(deployer)


def _apply_rpc_override():
    """If RPC_URL env var is set, point the current provider to that URI."""
    rpc_url = os.environ.get("RPC_URL")
    if not rpc_url:
        return
    provider = chain.provider
    if hasattr(provider, "uri"):
        provider.uri = rpc_url
        provider.disconnect()
        provider.connect()
        print(f"  RPC_URL override → {rpc_url}")
    else:
        print(
            f"  WARNING: RPC_URL={rpc_url} is set but the current provider "
            f"({type(provider).__name__}) does not support URI override. "
            "Ensure you are using --network ethereum:local:node."
        )


def main():
    print("\n=== Marketplace Demo ===\n")

    _apply_rpc_override()
    uri = getattr(chain.provider, "uri", None)
    print(f"  Network : {chain.provider.network.name} (chain_id={chain.chain_id})")
    if uri:
        print(f"  RPC URI : {uri}")

    deployer = _load_account("DEPLOYER_ALIAS", 0)
    node1 = _load_account("NODE1_ALIAS", 1)
    node2 = _load_account("NODE2_ALIAS", 2)

    nft, marketplace = _load_or_deploy(deployer)

    token_id = int(os.environ.get("TOKEN_ID", "9001"))
    price = int(os.environ.get("PRICE", str(10**18)))

    # ── Step 1: Deployer mints a ticket to Node1 ────────────────────
    print(f"\n[1] Minting token #{token_id} → Node1 ({node1.address}) ...")
    tx = nft.mint(node1, token_id, sender=deployer)
    print(f"    Owner: {nft.ownerOf(token_id)}  (tx: {tx.txn_hash})")

    # ── Step 2: Node1 approves the marketplace ──────────────────────
    print(f"\n[2] Node1 approves marketplace ...")
    nft.approve(marketplace.address, token_id, sender=node1)
    print(f"    Approved: {nft.getApproved(token_id)}")

    # ── Step 3: Node1 lists the ticket for sale ─────────────────────
    print(f"\n[3] Node1 lists token #{token_id} for {price} wei ({price / 10**18:.4f} ETH) ...")
    marketplace.listTicket(token_id, price, sender=node1)
    seller, p, active = marketplace.getListing(token_id)
    print(f"    Listing → seller: {seller}, price: {p} wei, active: {active}")

    # ── Step 4: Node2 buys the ticket ───────────────────────────────
    node1_bal_before = node1.balance
    node2_bal_before = node2.balance

    print(f"\n[4] Node2 ({node2.address}) buys token #{token_id} ...")
    receipt = marketplace.buyTicket(token_id, sender=node2, value=price)
    gas_cost = receipt.total_fees_paid

    new_owner = nft.ownerOf(token_id)
    _, _, still_active = marketplace.getListing(token_id)

    print(f"    Tx status : {receipt.status}")
    print(f"    New owner : {new_owner}")
    print(f"    Listing active: {still_active}")
    print(f"    Node1 received: +{node1.balance - node1_bal_before} wei")
    print(f"    Node2 spent   : -{node2_bal_before - node2.balance} wei (includes {gas_cost} gas)")

    print("\n=== Done! ===\n")
