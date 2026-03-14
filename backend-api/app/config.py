from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    rpc_url: str = "http://localhost:8545"
    chain_id: int = 1337
    nft_contract_address: str = ""
    marketplace_contract_address: str = ""
    deployments_dir: str = "../contracts/deployments"
    contracts_dir: str = "../contracts"
    wallets_dir: str = "../blockchain/wallets"
    deployer_private_key: str = ""
    cors_origins: str = "*"

    def get_cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    def load_deployment(self, filename: str) -> dict[str, Any] | None:
        """Load a deployment artifact JSON (address + ABI) from deployments_dir."""
        path = Path(self.deployments_dir) / filename
        if not path.is_file():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def resolve_nft(self) -> tuple[str, list[dict]]:
        """Return (address, abi) for TicketNFT, preferring env var over artifact."""
        data = self.load_deployment("ticket_nft.json")
        address = self.nft_contract_address or (data["address"] if data else "")
        abi = data["abi"] if data else []
        return address, abi

    def resolve_marketplace(self) -> tuple[str, list[dict]]:
        """Return (address, abi) for TicketMarketplace, preferring env var over artifact."""
        data = self.load_deployment("marketplace.json")
        address = self.marketplace_contract_address or (data["address"] if data else "")
        abi = data["abi"] if data else []
        return address, abi


settings = Settings()
