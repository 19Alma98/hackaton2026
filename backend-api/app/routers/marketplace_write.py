from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.contracts import get_marketplace_contract, get_nft_contract
from app.schemas import (
    ListingDetail,
    MarketplaceBuyRequest,
    MarketplaceCancelRequest,
    MarketplaceListRequest,
    OfferInfo,
    TxResult,
)
from app.tx_service import (
    parse_positive_wei,
    send_contract_transaction,
    to_checksum,
)

router = APIRouter(prefix="/api/marketplace", tags=["Marketplace Write"])


def _require_nft():
    contract = get_nft_contract()
    if contract is None:
        raise HTTPException(
            status_code=503,
            detail="NFT contract not configured. Deploy first or set env vars.",
        )
    return contract


def _require_marketplace():
    contract = get_marketplace_contract()
    if contract is None:
        raise HTTPException(
            status_code=503,
            detail="Marketplace contract not configured. Deploy first or set env vars.",
        )
    return contract


@router.get("/offers/{token_id}/{buyer_address}", response_model=OfferInfo)
def get_offer(token_id: int, buyer_address: str):
    marketplace = _require_marketplace()
    buyer = to_checksum(buyer_address)

    amount, active = marketplace.functions.getOffer(token_id, buyer).call()
    return OfferInfo(token_id=token_id, buyer=buyer, amount_wei=str(amount), active=active)


@router.get("/listing/{token_id}", response_model=ListingDetail)
def get_listing(token_id: int):
    """Return on-chain listing state for a token (getListing). Use to verify a listing."""
    marketplace = _require_marketplace()
    if token_id < 0:
        raise HTTPException(status_code=400, detail="token_id must be >= 0")
    seller, price, active = marketplace.functions.getListing(token_id).call()
    return ListingDetail(
        token_id=token_id,
        seller=seller,
        price_wei=str(price),
        active=active,
    )


@router.post("/list", response_model=TxResult)
def list_ticket(payload: MarketplaceListRequest):
    nft = _require_nft()
    marketplace = _require_marketplace()

    if payload.token_id < 0:
        raise HTTPException(status_code=400, detail="token_id must be >= 0")

    seller = to_checksum(payload.seller_address)
    price_wei = parse_positive_wei(payload.price_wei, "price_wei")

    try:
        owner = nft.functions.ownerOf(payload.token_id).call()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Token {payload.token_id} does not exist") from exc

    if owner.lower() != seller.lower():
        raise HTTPException(status_code=400, detail="seller_address is not token owner")

    approved = nft.functions.getApproved(payload.token_id).call()
    approved_for_all = nft.functions.isApprovedForAll(seller, marketplace.address).call()
    if approved.lower() != marketplace.address.lower() and not approved_for_all:
        raise HTTPException(status_code=400, detail="marketplace not approved for this token")

    tx_fn = marketplace.functions.listTicket(payload.token_id, price_wei)
    return send_contract_transaction(
        from_address=seller,
        contract_function=tx_fn,
        value_wei=0,
        wait_for_receipt=payload.wait_for_receipt,
    )


@router.post("/cancel", response_model=TxResult)
def cancel_listing(payload: MarketplaceCancelRequest):
    marketplace = _require_marketplace()

    if payload.token_id < 0:
        raise HTTPException(status_code=400, detail="token_id must be >= 0")

    seller = to_checksum(payload.seller_address)
    listing_seller, _, active = marketplace.functions.getListing(payload.token_id).call()

    if not active:
        raise HTTPException(status_code=400, detail="token is not listed")
    if listing_seller.lower() != seller.lower():
        raise HTTPException(status_code=400, detail="seller_address is not listing seller")

    tx_fn = marketplace.functions.cancelListing(payload.token_id)
    return send_contract_transaction(
        from_address=seller,
        contract_function=tx_fn,
        value_wei=0,
        wait_for_receipt=payload.wait_for_receipt,
    )


@router.post("/buy", response_model=TxResult)
def buy_ticket(payload: MarketplaceBuyRequest):
    marketplace = _require_marketplace()

    if payload.token_id < 0:
        raise HTTPException(status_code=400, detail="token_id must be >= 0")

    buyer = to_checksum(payload.buyer_address)
    value_wei = parse_positive_wei(payload.value_wei, "value_wei")

    seller, price, active = marketplace.functions.getListing(payload.token_id).call()
    if not active:
        raise HTTPException(status_code=400, detail="token is not listed")
    if buyer.lower() == seller.lower():
        raise HTTPException(status_code=400, detail="buyer_address cannot match seller")
    if value_wei < int(price):
        raise HTTPException(status_code=400, detail="value_wei is lower than listing price")

    tx_fn = marketplace.functions.buyTicket(payload.token_id)
    return send_contract_transaction(
        from_address=buyer,
        contract_function=tx_fn,
        value_wei=value_wei,
        wait_for_receipt=payload.wait_for_receipt,
    )
