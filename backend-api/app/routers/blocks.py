from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.schemas import BlockInfo
from app.web3_provider import w3

router = APIRouter(prefix="/api/blocks", tags=["Blocks"])


@router.get("/latest", response_model=list[BlockInfo])
def get_latest_blocks(count: int = Query(default=10, ge=1, le=100)):
    """Return the last *count* blocks with basic info (US 5.1.1)."""
    try:
        latest = w3.eth.block_number
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"RPC unreachable: {exc}")

    start = max(0, latest - count + 1)
    blocks: list[BlockInfo] = []
    for num in range(latest, start - 1, -1):
        block = w3.eth.get_block(num)
        blocks.append(
            BlockInfo(
                number=block["number"],
                timestamp=block["timestamp"],
                transaction_count=len(block["transactions"]),
                miner=block.get("miner", ""),
                gas_used=block["gasUsed"],
                gas_limit=block["gasLimit"],
                hash="0x" + block["hash"].hex(),
                parent_hash="0x" + block["parentHash"].hex(),
            )
        )
    return blocks
