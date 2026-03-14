from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.schemas import WalletInfo
from app.web3_provider import w3

router = APIRouter(prefix="/api/wallets", tags=["Wallets"])


def _load_known_wallets() -> list[tuple[str, str]]:
    """Read all (name, address) pairs from blockchain/wallets/*.json."""
    wallets_dir = Path(settings.wallets_dir)
    if not wallets_dir.is_dir():
        return []

    out: list[tuple[str, str]] = []
    for path in sorted(wallets_dir.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue

        if path.name == "test_accounts.json":
            for item in data.get("accounts", []):
                name = item.get("name")
                addr = item.get("address")
                if name and addr:
                    out.append((name, addr))
        else:
            addr = data.get("address")
            name = data.get("name", path.stem)
            if addr:
                out.append((name, addr))
    return out


def _wallet_info(name: str, address: str) -> WalletInfo:
    checksum = w3.to_checksum_address(address)
    balance = w3.eth.get_balance(checksum)
    nonce = w3.eth.get_transaction_count(checksum)
    return WalletInfo(
        name=name,
        address=checksum,
        balance_wei=str(balance),
        balance_eth=float(w3.from_wei(balance, "ether")),
        nonce=nonce,
    )


@router.get("", response_model=list[WalletInfo])
def get_wallets(address: str | None = Query(default=None)):
    """Return wallet info.

    - Without `address`: returns all known wallets from blockchain/wallets/.
    - With `address`: returns info for that specific address only.
    """
    if address is not None:
        try:
            checksum = w3.to_checksum_address(address)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid address: {address}")
        return [_wallet_info(checksum, checksum)]

    known = _load_known_wallets()
    if not known:
        raise HTTPException(status_code=404, detail="No wallet files found in wallets directory.")

    seen: set[str] = set()
    result: list[WalletInfo] = []
    for name, addr in known:
        key = addr.lower()
        if key in seen:
            continue
        seen.add(key)
        try:
            result.append(_wallet_info(name, addr))
        except Exception:
            continue
    return result
