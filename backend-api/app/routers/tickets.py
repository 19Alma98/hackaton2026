from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.contracts import get_marketplace_contract, get_nft_contract
from app.schemas import ListingInfo, MintRequest, MintResponse, TicketInfo, TokenHolderInfo
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


@router.get("/holders", response_model=list[TokenHolderInfo])
def get_token_holders():
    """Return all addresses that hold at least one token, with their balance and token IDs.

    Uses ERC721Enumerable: totalSupply + tokenByIndex + ownerOf.
    """
    nft = _require_nft()

    total = nft.functions.totalSupply().call()
    owners: dict[str, list[int]] = defaultdict(list)

    for i in range(total):
        token_id = nft.functions.tokenByIndex(i).call()
        owner = nft.functions.ownerOf(token_id).call()
        owners[owner].append(token_id)

    return [
        TokenHolderInfo(address=addr, balance=len(ids), token_ids=sorted(ids))
        for addr, ids in sorted(owners.items())
    ]


@router.post("/mint", response_model=MintResponse)
def mint_tickets(body: MintRequest):
    """Mint new tokens on the already-deployed TicketNFT contract.

    Token IDs are auto-assigned starting from the current totalSupply + 1.
    Just provide the recipient address and how many tokens (count).
    """
    nft = _require_nft()

    private_key = body.deployer_private_key or settings.deployer_private_key
    if not private_key:
        raise HTTPException(
            status_code=400,
            detail=(
                "No deployer key provided. Pass deployer_private_key in the "
                "request body or set DEPLOYER_PRIVATE_KEY env var."
            ),
        )

    if body.count < 1:
        raise HTTPException(status_code=400, detail="count must be at least 1")

    try:
        account = w3.eth.account.from_key(private_key)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid private key: {exc}")

    try:
        checksum = w3.to_checksum_address(body.recipient)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid recipient address: {body.recipient}")

    current_supply = nft.functions.totalSupply().call()
    start_id = current_supply + 1
    token_ids = list(range(start_id, start_id + body.count))
    recipients = [checksum] * body.count

    try:
        tx = nft.functions.mintBatch(
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
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Mint transaction failed: {exc}")

    if receipt.status != 1:
        raise HTTPException(status_code=500, detail="Mint transaction reverted on-chain")

    return MintResponse(
        recipient=checksum,
        minted_token_ids=token_ids,
        transaction_hash=receipt.transactionHash.hex(),
        message=f"Minted {body.count} token(s) to {checksum}",
    )


@router.get("/for-sale", response_model=list[ListingInfo])
def get_tickets_for_sale():
    """Return all tickets currently listed for sale on the marketplace (US 5.1.4).

    Uses on-chain state only: enumerates minted token IDs via NFT totalSupply/
    tokenByIndex, then calls getListing() for each. This avoids depending on
    event indexing (which can miss listings when RPC limits block range).
    """
    nft = _require_nft()
    marketplace = _require_marketplace()

    total = nft.functions.totalSupply().call()
    listings: list[ListingInfo] = []
    for i in range(total):
        token_id = nft.functions.tokenByIndex(i).call()
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
