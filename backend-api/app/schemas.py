from __future__ import annotations

from pydantic import BaseModel


class BlockInfo(BaseModel):
    number: int
    timestamp: int
    transaction_count: int
    miner: str
    gas_used: int
    gas_limit: int
    hash: str
    parent_hash: str


class EventListed(BaseModel):
    seller: str
    token_id: int
    price_wei: str
    block_number: int
    transaction_hash: str


class EventSold(BaseModel):
    seller: str
    buyer: str
    token_id: int
    price_wei: str
    block_number: int
    transaction_hash: str


class TicketInfo(BaseModel):
    token_id: int
    owner: str


class ListingInfo(BaseModel):
    token_id: int
    seller: str
    price_wei: str


class WalletInfo(BaseModel):
    name: str
    address: str
    balance_wei: str
    balance_eth: float
    nonce: int


class AppConfig(BaseModel):
    chain_id: int
    rpc_url: str
    nft_contract_address: str
    marketplace_contract_address: str


class HealthResponse(BaseModel):
    status: str
    block_number: int | None = None
    rpc_url: str
    chain_id: int


class DeployRequest(BaseModel):
    initial_mint: int = 0
    deployer_private_key: str = ""
    token_name: str = "Hacka"
    token_symbol: str = "HAK"


class DeployResponse(BaseModel):
    nft_address: str
    marketplace_address: str
    deployer: str
    initial_mint: int
    message: str


class TokenHolderInfo(BaseModel):
    address: str
    balance: int
    token_ids: list[int]


class MintRequest(BaseModel):
    recipient: str
    count: int = 1
    deployer_private_key: str = ""


class MintResponse(BaseModel):
    recipient: str
    minted_token_ids: list[int]
    transaction_hash: str
    message: str
