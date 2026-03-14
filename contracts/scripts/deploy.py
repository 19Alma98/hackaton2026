"""
Deploy TicketNFT and TicketMarketplace to the connected network and save
address + ABI for each.

Usage (local test network):
    ape run deploy

Usage (private Geth network):
    ape run deploy --network ethereum:local:node

Set DEPLOYER_ALIAS to use a named account (imported via `ape accounts import`):
    DEPLOYER_ALIAS=my-deployer ape run deploy --network ethereum:local:node

Set INITIAL_MINT to mint sample tickets on deploy:
    INITIAL_MINT=5 ape run deploy
"""

import json
import os
from pathlib import Path

from ape import accounts, project


TOKEN_NAME = "Hacka"
TOKEN_SYMBOL = "HAK"


def main():
    deployer_alias = os.environ.get("DEPLOYER_ALIAS")
    if deployer_alias:
        deployer = accounts.load(deployer_alias)
    else:
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
