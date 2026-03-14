from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.contracts import get_marketplace_contract, get_nft_contract
from app.routers import app_config, blocks, events, tickets, wallets
from app.web3_provider import check_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    if check_connection():
        print(f"Connected to RPC at {settings.rpc_url}")
    else:
        print(f"WARNING: cannot reach RPC at {settings.rpc_url}")

    nft = get_nft_contract()
    mkt = get_marketplace_contract()
    if nft:
        print(f"TicketNFT loaded at {nft.address}")
    else:
        print("WARNING: TicketNFT contract not available (deploy first or set env vars)")
    if mkt:
        print(f"TicketMarketplace loaded at {mkt.address}")
    else:
        print("WARNING: TicketMarketplace contract not available (deploy first or set env vars)")

    yield


app = FastAPI(
    title="Hackaton 2026 – Ticket API",
    description="REST API for the TicketNFT / Marketplace private blockchain.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(blocks.router)
app.include_router(events.router)
app.include_router(tickets.router)
app.include_router(wallets.router)
app.include_router(app_config.router)
