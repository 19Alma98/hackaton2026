"""
Verifica che un wallet sia raggiungibile sulla chain: mostra balance e nonce.

Uso (rete Geth locale):
    uv run ape run check_wallet --network ethereum:local:node

Per un account importato (es. seriea):
    uv run ape run check_wallet --alias seriea --network ethereum:local:node

Oppure con variabile d'ambiente:
    WALLET_ALIAS=seriea uv run ape run check_wallet --network ethereum:local:node

Per un indirizzo raw (senza account Ape):
    uv run ape run check_wallet -a 0x2B49...6019 --network ethereum:local:node

Per vedere tutti i wallet (importati in Ape + da blockchain/wallets):
    uv run ape run check_wallet --all --network ethereum:local:node

Per pubblicare gli account di test in blockchain/wallets/test_accounts.json:
    uv run ape run check_wallet --publish --network ethereum:local:node
"""

import json
import os
from pathlib import Path

import click

from ape import accounts, chain
from ape.cli import ConnectedProviderCommand


EXPECTED_CHAIN_ID = 1337


def _apply_rpc_override():
    rpc_url = os.environ.get("RPC_URL")
    if not rpc_url:
        return
    provider = chain.provider
    if hasattr(provider, "uri"):
        provider.uri = rpc_url
        provider.disconnect()
        provider.connect()
        print(f"RPC override: {rpc_url}\n")


def _check_address(address):
    """Restituisce (balance, nonce) per un indirizzo sulla chain connessa."""
    balance = chain.provider.get_balance(address)
    nonce = chain.provider.get_nonce(address)
    return balance, nonce


def _project_wallets_dir():
    """Restituisce il path di blockchain/wallets (project root)."""
    base = Path(__file__).resolve().parent.parent.parent
    return base / "blockchain" / "wallets"


def _wallets_from_project():
    """Legge gli indirizzi da blockchain/wallets/*.json (se esistono)."""
    wallets_dir = _project_wallets_dir()
    if not wallets_dir.is_dir():
        return []
    out = []
    for path in sorted(wallets_dir.glob("*.json")):
        try:
            data = json.loads(path.read_text())
            if path.name == "test_accounts.json":
                for item in data.get("accounts", []):
                    name = item.get("name")
                    addr = item.get("address")
                    if name and addr:
                        out.append((name, addr))
                continue
            addr = data.get("address")
            name = data.get("name", path.stem)
            if addr:
                out.append((name, addr))
        except (json.JSONDecodeError, OSError):
            continue
    return out


def _publish_test_accounts():
    """Scrive blockchain/wallets/test_accounts.json con tutti i test account Ape."""
    wallets_dir = _project_wallets_dir()
    wallets_dir.mkdir(parents=True, exist_ok=True)
    out_file = wallets_dir / "test_accounts.json"
    accounts_list = [
        {"name": f"test_account_{i}", "address": acc.address}
        for i, acc in enumerate(accounts.test_accounts)
    ]
    payload = {
        "name": "test_accounts",
        "source": "ape.test_accounts",
        "accounts": accounts_list,
    }
    out_file.write_text(json.dumps(payload, indent=2))
    return out_file


@click.command(cls=ConnectedProviderCommand)
@click.option(
    "--alias", "-a",
    default=None,
    help="Account alias (es. seriea) o indirizzo 0x da verificare.",
)
@click.option(
    "--all", "show_all",
    is_flag=True,
    help="Mostra tutti i wallet (Ape + blockchain/wallets) con balance e nonce.",
)
@click.option(
    "--publish",
    is_flag=True,
    help="Scrivi blockchain/wallets/test_accounts.json con gli account di test.",
)
def cli(alias, show_all, publish):
    target = alias or os.environ.get("WALLET_ALIAS")

    _apply_rpc_override()

    if chain.chain_id != EXPECTED_CHAIN_ID:
        print(
            f"ATTENZIONE: chain_id={chain.chain_id} "
            f"(genesis prevede {EXPECTED_CHAIN_ID}). RPC corretto?"
        )

    print(f"Chain ID: {chain.chain_id}\n")

    if show_all:
        def _norm(addr):
            return addr.lower() if addr else ""

        seen = set()

        # 1) Account importati in Ape
        try:
            aliases = list(accounts.aliases)
        except Exception:
            aliases = []
        if aliases:
            print("Account Ape (importati):")
            for name in sorted(aliases):
                try:
                    acc = accounts.load(name)
                    address = acc.address
                    key = _norm(address)
                    if key in seen:
                        continue
                    seen.add(key)
                    balance, nonce = _check_address(address)
                    print(f"  {name}: {address}  balance={balance} wei  nonce={nonce}")
                except Exception as e:
                    print(f"  {name}: (errore: {e})")
            print()

        # 2) Wallet da blockchain/wallets/*.json
        project_wallets = _wallets_from_project()
        if project_wallets:
            print("Wallet da blockchain/wallets/*.json:")
            for name, address in project_wallets:
                key = _norm(address)
                if key in seen:
                    continue
                seen.add(key)
                balance, nonce = _check_address(address)
                print(f"  {name}: {address}  balance={balance} wei  nonce={nonce}")
            print()

        # 3) Test accounts (tutti e 10)
        print("Account di test (Ape test_accounts):")
        for i, acc in enumerate(accounts.test_accounts):
            key = _norm(acc.address)
            if key in seen:
                continue
            balance, nonce = _check_address(acc.address)
            name = f"test_account_{i}"
            print(f"  {name}: {acc.address}  balance={balance} wei  nonce={nonce}")

        if publish:
            out_file = _publish_test_accounts()
            print(f"\nPubblicato: {out_file}")
        return

    if publish:
        _publish_test_accounts()
        out_file = _project_wallets_dir() / "test_accounts.json"
        click.echo(f"Pubblicato: {out_file}")
        return

    if not target:
        print(
            "Uso: ape run check_wallet --alias seriea "
            "--network ethereum:local:node"
        )
        print(
            "     oppure: ape run check_wallet --all "
            "--network ethereum:local:node\n"
        )
        print("Account di test (se disponibili):")
        for acc in accounts.test_accounts[:5]:
            balance, nonce = _check_address(acc.address)
            print(f"  {acc.address}  balance={balance} wei  nonce={nonce}")
        return

    # Indirizzo raw (0x...)
    if target.startswith("0x") and len(target) == 42:
        address = target
        label = address
    else:
        # Alias account Ape
        try:
            acc = accounts.load(target)
            address = acc.address
            label = f"{target} ({address})"
        except Exception as e:
            click.echo(f"Errore: account '{target}' non trovato. {e}")
            raise SystemExit(1)

    balance, nonce = _check_address(address)
    print(f"Wallet: {label}")
    print(f"  Balance: {balance} wei")
    print(f"  Nonce:   {nonce}")
    print(
        "\nSe balance e nonce sono stati letti, "
        "il wallet è raggiungibile sulla chain."
    )
