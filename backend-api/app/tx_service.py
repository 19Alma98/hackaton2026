from __future__ import annotations

import time

from eth_account import Account
from fastapi import HTTPException
from web3.exceptions import TransactionNotFound
from web3.types import TxParams

from app.config import settings
from app.schemas import TxResult
from app.web3_provider import w3


def to_checksum(address: str) -> str:
    try:
        return w3.to_checksum_address(address)
    except Exception as exc:  # pragma: no cover - exact Web3 exception varies
        raise HTTPException(status_code=400, detail=f"Invalid address: {address}") from exc


def parse_positive_wei(value: str, field_name: str) -> int:
    try:
        wei_value = int(value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"{field_name} must be an integer in wei") from exc

    if wei_value <= 0:
        raise HTTPException(status_code=400, detail=f"{field_name} must be > 0")
    return wei_value


def _normalize_private_key(key: str) -> str:
    normalized = key.strip()
    if not normalized:
        return ""
    if not normalized.startswith("0x"):
        normalized = f"0x{normalized}"
    return normalized


def _resolve_signer_key(from_address: str) -> str:
    keys = settings.get_custodial_keys()
    from_key = keys.get(from_address.lower(), "")
    if from_key:
        return _normalize_private_key(from_key)

    fallback = _normalize_private_key(settings.default_signer_private_key)
    if fallback:
        return fallback

    raise HTTPException(
        status_code=503,
        detail=(
            "No signer key configured for this address. "
            "Set CUSTODIAL_KEYS_JSON or DEFAULT_SIGNER_PRIVATE_KEY in backend-api/.env"
        ),
    )


def _sanitize_error_message(exc: Exception) -> str:
    return str(exc).splitlines()[0][:300]


def _wait_for_receipt(tx_hash_hex: str):
    deadline = time.time() + max(1, settings.receipt_timeout_seconds)
    poll_seconds = max(0.2, settings.receipt_poll_interval_seconds)

    while time.time() < deadline:
        try:
            return w3.eth.get_transaction_receipt(tx_hash_hex)
        except TransactionNotFound:
            time.sleep(poll_seconds)

    return None


def _format_from_receipt(tx_hash_hex: str, receipt) -> TxResult:
    try:
        tx = w3.eth.get_transaction(tx_hash_hex)
    except Exception:
        tx = None

    status = "success" if getattr(receipt, "status", 0) == 1 else "failed"

    return TxResult(
        tx_hash=tx_hash_hex,
        status=status,
        block_number=receipt.blockNumber,
        transaction_index=receipt.transactionIndex,
        gas_used=receipt.gasUsed,
        from_address=(tx["from"] if tx is not None else None),
        to_address=(tx["to"] if tx is not None else None),
        value_wei=(str(tx["value"]) if tx is not None else None),
        error=None if status == "success" else "Transaction reverted",
    )


def _sign_and_send(tx: TxParams, from_address: str, wait_for_receipt: bool) -> TxResult:
    signer_key = _resolve_signer_key(from_address)

    try:
        signer = Account.from_key(signer_key)
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail="Configured signer key is invalid") from exc

    if signer.address.lower() != from_address.lower():
        raise HTTPException(
            status_code=403,
            detail=(
                "Signer key does not match from_address. "
                "Use CUSTODIAL_KEYS_JSON mapping for each allowed sender address."
            ),
        )

    tx_to_sign: TxParams = {
        **tx,
        "from": signer.address,
        "chainId": settings.chain_id,
        "nonce": w3.eth.get_transaction_count(signer.address, "pending"),
        "gasPrice": w3.eth.gas_price,
    }

    if "gas" not in tx_to_sign:
        tx_to_sign["gas"] = w3.eth.estimate_gas(tx_to_sign)

    try:
        signed = Account.sign_transaction(tx_to_sign, signer_key)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        tx_hash_hex = tx_hash.hex()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to send transaction: {_sanitize_error_message(exc)}") from exc

    if not wait_for_receipt:
        return TxResult(tx_hash=tx_hash_hex, status="submitted")

    receipt = _wait_for_receipt(tx_hash_hex)
    if receipt is None:
        return TxResult(
            tx_hash=tx_hash_hex,
            status="pending",
            error=f"Receipt not available after {settings.receipt_timeout_seconds}s",
        )

    return _format_from_receipt(tx_hash_hex, receipt)


def send_native_transfer(
    from_address: str,
    to_address: str,
    amount_wei: int,
    wait_for_receipt: bool,
) -> TxResult:
    tx: TxParams = {
        "to": to_address,
        "value": amount_wei,
        "gas": 21_000,
    }
    return _sign_and_send(tx=tx, from_address=from_address, wait_for_receipt=wait_for_receipt)


def send_contract_transaction(from_address: str, contract_function, value_wei: int, wait_for_receipt: bool) -> TxResult:
    try:
        signer_nonce = w3.eth.get_transaction_count(from_address, "pending")
        tx = contract_function.build_transaction(
            {
                "from": from_address,
                "nonce": signer_nonce,
                "chainId": settings.chain_id,
                "gasPrice": w3.eth.gas_price,
                "value": value_wei,
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Cannot build contract transaction: {_sanitize_error_message(exc)}") from exc

    return _sign_and_send(tx=tx, from_address=from_address, wait_for_receipt=wait_for_receipt)


def get_transaction_status(tx_hash: str) -> TxResult:
    if not tx_hash.startswith("0x"):
        tx_hash = f"0x{tx_hash}"

    try:
        receipt = w3.eth.get_transaction_receipt(tx_hash)
        return _format_from_receipt(tx_hash, receipt)
    except TransactionNotFound:
        pass
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid tx hash: {_sanitize_error_message(exc)}") from exc

    try:
        tx = w3.eth.get_transaction(tx_hash)
        return TxResult(
            tx_hash=tx_hash,
            status="pending",
            from_address=tx["from"],
            to_address=tx["to"],
            value_wei=str(tx["value"]),
        )
    except TransactionNotFound:
        return TxResult(tx_hash=tx_hash, status="not_found", error="Transaction not found")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid tx hash: {_sanitize_error_message(exc)}") from exc
