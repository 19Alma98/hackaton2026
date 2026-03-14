from __future__ import annotations

from fastapi import APIRouter

from app.config import settings
from app.schemas import AppConfig, HealthResponse
from app.web3_provider import w3

router = APIRouter(prefix="/api", tags=["Config"])


@router.get("/config", response_model=AppConfig)
def get_app_config():
    """Return chain configuration so the frontend doesn't need to hardcode it (US 5.3.2)."""
    nft_addr = settings.nft_contract_address
    mkt_addr = settings.marketplace_contract_address

    if not nft_addr or not mkt_addr:
        nft_data = settings.load_deployment("ticket_nft.json")
        mkt_data = settings.load_deployment("marketplace.json")
        nft_addr = nft_addr or (nft_data["address"] if nft_data else "")
        mkt_addr = mkt_addr or (mkt_data["address"] if mkt_data else "")

    return AppConfig(
        chain_id=settings.chain_id,
        rpc_url=settings.rpc_url,
        nft_contract_address=nft_addr,
        marketplace_contract_address=mkt_addr,
    )


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Verify the API can reach the RPC node."""
    try:
        block = w3.eth.block_number
        status = "ok"
    except Exception:
        block = None
        status = "rpc_unreachable"

    return HealthResponse(
        status=status,
        block_number=block,
        rpc_url=settings.rpc_url,
        chain_id=settings.chain_id,
    )
