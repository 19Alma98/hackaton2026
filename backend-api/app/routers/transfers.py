from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.contracts import get_nft_contract
from app.schemas import EthTransferRequest, NftApproveRequest, NftTransferRequest, TxResult
from app.tx_service import (
    get_transaction_status,
    parse_positive_wei,
    send_contract_transaction,
    send_native_transfer,
    to_checksum,
)

router = APIRouter(prefix="/api/transfers", tags=["Transfers"])


def _require_nft():
    contract = get_nft_contract()
    if contract is None:
        raise HTTPException(
            status_code=503,
            detail="NFT contract not configured. Deploy first or set env vars.",
        )
    return contract


@router.get("/tx/{tx_hash}", response_model=TxResult)
def get_tx_status(tx_hash: str):
    return get_transaction_status(tx_hash)


@router.post("/eth", response_model=TxResult)
def transfer_eth(payload: EthTransferRequest):
    from_address = to_checksum(payload.from_address)
    to_address = to_checksum(payload.to_address)

    if from_address == to_address:
        raise HTTPException(status_code=400, detail="from_address and to_address must be different")

    amount_wei = parse_positive_wei(payload.amount_wei, "amount_wei")
    return send_native_transfer(
        from_address=from_address,
        to_address=to_address,
        amount_wei=amount_wei,
        wait_for_receipt=payload.wait_for_receipt,
    )


@router.post("/nft", response_model=TxResult)
def transfer_nft(payload: NftTransferRequest):
    nft = _require_nft()

    if payload.token_id < 0:
        raise HTTPException(status_code=400, detail="token_id must be >= 0")

    from_address = to_checksum(payload.from_address)
    to_address = to_checksum(payload.to_address)

    if from_address == to_address:
        raise HTTPException(status_code=400, detail="from_address and to_address must be different")

    try:
        owner = nft.functions.ownerOf(payload.token_id).call()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Token {payload.token_id} does not exist") from exc

    if owner.lower() != from_address.lower():
        raise HTTPException(status_code=400, detail="from_address is not the token owner")

    tx_fn = nft.functions.transferFrom(from_address, to_address, payload.token_id)
    return send_contract_transaction(
        from_address=from_address,
        contract_function=tx_fn,
        value_wei=0,
        wait_for_receipt=payload.wait_for_receipt,
    )


@router.post("/nft/approve", response_model=TxResult)
def approve_nft(payload: NftApproveRequest):
    nft = _require_nft()

    if payload.token_id < 0:
        raise HTTPException(status_code=400, detail="token_id must be >= 0")

    owner_address = to_checksum(payload.owner_address)
    approved_address = to_checksum(payload.approved_address)

    try:
        owner = nft.functions.ownerOf(payload.token_id).call()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Token {payload.token_id} does not exist") from exc

    if owner.lower() != owner_address.lower():
        raise HTTPException(status_code=400, detail="owner_address is not the token owner")

    tx_fn = nft.functions.approve(approved_address, payload.token_id)
    return send_contract_transaction(
        from_address=owner_address,
        contract_function=tx_fn,
        value_wei=0,
        wait_for_receipt=payload.wait_for_receipt,
    )
