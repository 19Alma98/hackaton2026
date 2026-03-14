from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.contracts import get_marketplace_contract
from app.schemas import EventListed, EventSold

router = APIRouter(prefix="/api/events", tags=["Events"])


def _require_marketplace():
    contract = get_marketplace_contract()
    if contract is None:
        raise HTTPException(
            status_code=503,
            detail="Marketplace contract not configured. Deploy first or set env vars.",
        )
    return contract


@router.get("/listed", response_model=list[EventListed])
def get_listed_events(from_block: int = Query(default=0, ge=0)):
    """Return all Listed events emitted by the Marketplace contract (US 5.1.2)."""
    contract = _require_marketplace()
    logs = contract.events.Listed.get_logs(from_block=from_block)
    return [
        EventListed(
            seller=log.args.seller,
            token_id=log.args.tokenId,
            price_wei=str(log.args.price),
            block_number=log.blockNumber,
            transaction_hash=log.transactionHash.hex(),
        )
        for log in logs
    ]


@router.get("/sold", response_model=list[EventSold])
def get_sold_events(from_block: int = Query(default=0, ge=0)):
    """Return all Sold events emitted by the Marketplace contract (US 5.1.2)."""
    contract = _require_marketplace()
    logs = contract.events.Sold.get_logs(from_block=from_block)
    return [
        EventSold(
            seller=log.args.seller,
            buyer=log.args.buyer,
            token_id=log.args.tokenId,
            price_wei=str(log.args.price),
            block_number=log.blockNumber,
            transaction_hash=log.transactionHash.hex(),
        )
        for log in logs
    ]
