from __future__ import annotations

from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

from app.config import settings

w3 = Web3(Web3.HTTPProvider(settings.rpc_url))
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)


def check_connection() -> bool:
    try:
        w3.eth.block_number  # noqa: B018 – side-effect: verifies RPC is reachable
        return True
    except Exception:
        return False
