from __future__ import annotations

from web3.contract import Contract

from app.config import settings
from app.web3_provider import w3

_nft_contract: Contract | None = None
_marketplace_contract: Contract | None = None


def _build_contract(address: str, abi: list[dict]) -> Contract | None:
    if not address or not abi:
        return None
    return w3.eth.contract(address=w3.to_checksum_address(address), abi=abi)


def get_nft_contract() -> Contract | None:
    global _nft_contract
    if _nft_contract is None:
        addr, abi = settings.resolve_nft()
        _nft_contract = _build_contract(addr, abi)
    return _nft_contract


def get_marketplace_contract() -> Contract | None:
    global _marketplace_contract
    if _marketplace_contract is None:
        addr, abi = settings.resolve_marketplace()
        _marketplace_contract = _build_contract(addr, abi)
    return _marketplace_contract


def reload_contracts() -> None:
    """Force re-read of deployment artifacts (e.g. after a fresh deploy)."""
    global _nft_contract, _marketplace_contract
    _nft_contract = None
    _marketplace_contract = None
