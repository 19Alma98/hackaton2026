from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.contracts import get_marketplace_contract, get_nft_contract
from app.schemas import ListingInfo, TicketInfo
from app.web3_provider import w3

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


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


@router.get("/user/{address}", response_model=list[TicketInfo])
def get_user_tickets(address: str):
    """Return all tickets (token IDs) owned by the given address (US 5.1.3).

    Uses ERC721Enumerable: balanceOf + tokenOfOwnerByIndex.
    """
    nft = _require_nft()
    try:
        checksum = w3.to_checksum_address(address)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid address: {address}")

    balance = nft.functions.balanceOf(checksum).call()
    tickets: list[TicketInfo] = []
    for i in range(balance):
        token_id = nft.functions.tokenOfOwnerByIndex(checksum, i).call()
        tickets.append(TicketInfo(token_id=token_id, owner=checksum))
    return tickets


@router.get("/for-sale", response_model=list[ListingInfo])
def get_tickets_for_sale():
    """Return all tickets currently listed for sale on the marketplace (US 5.1.4).

    Scans Listed events, excludes Sold / ListingCancelled tokens, then
    double-checks on-chain with getListing().
    """
    marketplace = _require_marketplace()

    listed_logs = marketplace.events.Listed.get_logs(from_block=0)
    sold_logs = marketplace.events.Sold.get_logs(from_block=0)
    cancelled_logs = marketplace.events.ListingCancelled.get_logs(from_block=0)

    sold_ids = {log.args.tokenId for log in sold_logs}
    cancelled_ids = {log.args.tokenId for log in cancelled_logs}
    candidate_ids = {log.args.tokenId for log in listed_logs} - sold_ids - cancelled_ids

    listings: list[ListingInfo] = []
    for token_id in sorted(candidate_ids):
        seller, price, active = marketplace.functions.getListing(token_id).call()
        if active:
            listings.append(
                ListingInfo(
                    token_id=token_id,
                    seller=seller,
                    price_wei=str(price),
                )
            )
    return listings
