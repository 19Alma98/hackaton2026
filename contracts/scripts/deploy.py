"""
Deploy TicketNFT and TicketMarketplace to the connected network and save
address + ABI for each.

Usage (local test network):
    ape run deploy

Usage (private Geth network on localhost):
    ape run deploy --network ethereum:local:node

Usage (private Geth network on a remote LAN node):
    RPC_URL=http://192.168.2.208:8545 ape run deploy --network ethereum:local:node

Set DEPLOYER_ALIAS to use a named account (imported via `ape accounts import`):
    DEPLOYER_ALIAS=my-deployer ape run deploy --network ethereum:local:node

If DEPLOYER_ALIAS is not set, the script tries the 'ente' alias (the
dedicated organization wallet) before falling back to test_accounts[0].

Set INITIAL_MINT to mint sample tickets on deploy:
    INITIAL_MINT=5 ape run deploy
"""

import json
import os
from pathlib import Path

from ape import accounts, chain, project


TOKEN_NAME = os.environ.get("TOKEN_NAME", "Hacka")
TOKEN_SYMBOL = os.environ.get("TOKEN_SYMBOL", "HAK")
EXPECTED_CHAIN_ID = 1337


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
        print(f"RPC_URL override → {rpc_url}")
    else:
        print(
            f"WARNING: RPC_URL={rpc_url} is set but the current provider "
            f"({type(provider).__name__}) does not support URI override. "
            "Ensure you are using --network ethereum:local:node."
        )


def _print_connection_info():
    uri = getattr(chain.provider, "uri", None)
    print(f"Network : {chain.provider.network.name} (provider: {chain.provider.name})")
    if uri:
        print(f"RPC URI : {uri}")
    print(f"Chain ID: {chain.chain_id}")
    if chain.chain_id != EXPECTED_CHAIN_ID:
        raise SystemExit(
            f"ERROR: chain_id mismatch — expected {EXPECTED_CHAIN_ID} "
            f"(from genesis), got {chain.chain_id}. "
            "Check ape-config.yaml or RPC_URL."
        )


def main():
    _apply_rpc_override()
    _print_connection_info()

    deployer_alias = os.environ.get("DEPLOYER_ALIAS")
    if deployer_alias:
        deployer = accounts.load(deployer_alias)
    else:
        try:
            deployer = accounts.load("ente")
            print(f"No DEPLOYER_ALIAS set, loaded 'ente' wallet: {deployer.address}")
        except Exception:
            deployer = accounts.test_accounts[0]
            print(f"No DEPLOYER_ALIAS set, using test account: {deployer.address}")

    print(f"Deploying {TOKEN_NAME} ({TOKEN_SYMBOL}) from {deployer.address} ...")
    nft = deployer.deploy(project.TicketNFT, TOKEN_NAME, TOKEN_SYMBOL)
    print(f"TicketNFT deployed at: {nft.address}")

    print(f"Deploying TicketMarketplace (nft={nft.address}) from {deployer.address} ...")
    marketplace = deployer.deploy(project.TicketMarketplace, nft.address)
    print(f"TicketMarketplace deployed at: {marketplace.address}")

    initial_mint = int(os.environ.get("INITIAL_MINT", "0"))
    if initial_mint > 0:
        print(f"Minting {initial_mint} initial tickets to deployer ...")
        token_ids = list(range(1, initial_mint + 1))
        recipients = [deployer.address] * initial_mint
        nft.mintBatch(recipients, token_ids, sender=deployer)
        print(f"Minted token IDs 1..{initial_mint} to {deployer.address}")

    _save_deployment(nft, "ticket_nft.json", "TicketNFT")
    _save_deployment(marketplace, "marketplace.json", "TicketMarketplace")


def _save_deployment(contract, filename, contract_name):
    out_dir = Path(__file__).resolve().parent.parent / "deployments"
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / filename

    abi = [item.dict() for item in contract.contract_type.abi]

    payload = {
        "contract_name": contract_name,
        "address": contract.address,
        "abi": abi,
    }
    out_file.write_text(json.dumps(payload, indent=2))
    print(f"Deployment info saved to {out_file}")
