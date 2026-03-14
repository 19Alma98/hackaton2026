from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

import requests
import solcx
from fastapi import APIRouter, HTTPException
from web3 import Web3

from app.config import settings
from app.contracts import reload_contracts
from app.schemas import DeployRequest, DeployResponse
from app.web3_provider import w3

router = APIRouter(prefix="/api/deploy", tags=["Deploy"])

SOLC_VERSION = "0.8.19"
OZ_VERSION = "4.9.6"
OZ_GITHUB_URL = (
    f"https://github.com/OpenZeppelin/openzeppelin-contracts"
    f"/archive/refs/tags/v{OZ_VERSION}.zip"
)


def _ensure_solc() -> None:
    installed = [str(v) for v in solcx.get_installed_solc_versions()]
    if SOLC_VERSION not in installed:
        solcx.install_solc(SOLC_VERSION)


def _ensure_openzeppelin(contracts_dir: Path) -> Path:
    """Download OpenZeppelin contracts from GitHub if not cached locally."""
    lib_dir = contracts_dir / "lib"
    oz_dir = lib_dir / f"openzeppelin-contracts-{OZ_VERSION}"
    if oz_dir.is_dir() and any(oz_dir.iterdir()):
        return oz_dir

    lib_dir.mkdir(parents=True, exist_ok=True)
    resp = requests.get(OZ_GITHUB_URL, timeout=120)
    resp.raise_for_status()

    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        zf.extractall(lib_dir)

    if not oz_dir.is_dir():
        raise RuntimeError(
            f"Expected {oz_dir} after extracting OpenZeppelin archive"
        )
    return oz_dir


def _compile_contracts(contracts_dir: Path) -> dict:
    """Compile TicketNFT and TicketMarketplace using solcx."""
    _ensure_solc()
    oz_dir = _ensure_openzeppelin(contracts_dir)

    sol_dir = contracts_dir / "contracts"
    nft_source = (sol_dir / "TicketNFT.sol").read_text(encoding="utf-8")
    mkt_source = (sol_dir / "TicketMarketplace.sol").read_text(encoding="utf-8")

    remapping = f"@openzeppelin/={oz_dir.as_posix()}/"

    compiled = solcx.compile_standard(
        {
            "language": "Solidity",
            "sources": {
                "contracts/TicketNFT.sol": {"content": nft_source},
                "contracts/TicketMarketplace.sol": {"content": mkt_source},
            },
            "settings": {
                "remappings": [remapping],
                "outputSelection": {
                    "*": {"*": ["abi", "evm.bytecode"]},
                },
            },
        },
        solc_version=SOLC_VERSION,
        allow_paths=[str(oz_dir)],
    )
    return compiled


def _get_contract_data(compiled: dict, source_path: str, name: str):
    info = compiled["contracts"][source_path][name]
    return info["abi"], info["evm"]["bytecode"]["object"]


def _deploy_contract(
    w3_inst: Web3, abi: list, bytecode: str, account, *constructor_args
) -> str:
    factory = w3_inst.eth.contract(abi=abi, bytecode=bytecode)
    tx = factory.constructor(*constructor_args).build_transaction(
        {
            "from": account.address,
            "nonce": w3_inst.eth.get_transaction_count(account.address),
            "gas": 6_000_000,
            "gasPrice": w3_inst.eth.gas_price or w3_inst.to_wei(1, "gwei"),
        }
    )
    signed = account.sign_transaction(tx)
    tx_hash = w3_inst.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3_inst.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    if receipt.status != 1:
        raise RuntimeError(f"Transaction reverted: {tx_hash.hex()}")
    return receipt.contractAddress


def _save_deployment(
    address: str, abi: list, filename: str, contract_name: str
) -> None:
    out_dir = Path(settings.deployments_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "contract_name": contract_name,
        "address": address,
        "abi": abi,
    }
    (out_dir / filename).write_text(json.dumps(payload, indent=2))


@router.post("", response_model=DeployResponse)
def deploy_contracts(body: DeployRequest | None = None):
    """Compile and deploy TicketNFT + TicketMarketplace using solcx / web3.py.

    Provide a deployer_private_key in the request body or set
    DEPLOYER_PRIVATE_KEY in the environment.
    """
    if body is None:
        body = DeployRequest()

    private_key = body.deployer_private_key or settings.deployer_private_key
    if not private_key:
        raise HTTPException(
            status_code=400,
            detail=(
                "No deployer key provided. Pass deployer_private_key in the "
                "request body or set DEPLOYER_PRIVATE_KEY env var."
            ),
        )

    contracts_dir = Path(settings.contracts_dir).resolve()
    if not contracts_dir.is_dir():
        raise HTTPException(
            status_code=500,
            detail=f"Contracts directory not found: {contracts_dir}",
        )

    try:
        account = w3.eth.account.from_key(private_key)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Invalid private key: {exc}"
        )

    try:
        compiled = _compile_contracts(contracts_dir)
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Compilation failed: {exc}"
        )

    nft_abi, nft_bin = _get_contract_data(
        compiled, "contracts/TicketNFT.sol", "TicketNFT"
    )
    mkt_abi, mkt_bin = _get_contract_data(
        compiled, "contracts/TicketMarketplace.sol", "TicketMarketplace"
    )

    try:
        nft_address = _deploy_contract(
            w3, nft_abi, nft_bin, account, body.token_name, body.token_symbol
        )

        mkt_address = _deploy_contract(
            w3, mkt_abi, mkt_bin, account, nft_address
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"On-chain deployment failed: {exc}"
        )

    if body.initial_mint > 0:
        try:
            nft_contract = w3.eth.contract(
                address=nft_address, abi=nft_abi
            )
            token_ids = list(range(1, body.initial_mint + 1))
            recipients = [account.address] * body.initial_mint
            tx = nft_contract.functions.mintBatch(
                recipients, token_ids
            ).build_transaction(
                {
                    "from": account.address,
                    "nonce": w3.eth.get_transaction_count(account.address),
                    "gas": 6_000_000,
                    "gasPrice": w3.eth.gas_price or w3.to_wei(1, "gwei"),
                }
            )
            signed = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
            w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Contracts deployed but minting failed: {exc}",
            )

    _save_deployment(nft_address, nft_abi, "ticket_nft.json", "TicketNFT")
    _save_deployment(
        mkt_address, mkt_abi, "marketplace.json", "TicketMarketplace"
    )

    reload_contracts()

    return DeployResponse(
        nft_address=nft_address,
        marketplace_address=mkt_address,
        deployer=account.address,
        initial_mint=body.initial_mint,
        message="Contracts deployed successfully",
    )
