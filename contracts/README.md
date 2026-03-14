# Contracts

Smart contract ERC-721 per i token-biglietti. Tooling: [Ape Framework](https://docs.apeworx.io/) con plugin `ape-solidity`.

## Struttura

```
contracts/
├── ape-config.yaml          # Configurazione Ape (dipendenze, solc, rete)
├── contracts/
│   └── TicketNFT.sol        # ERC-721 Enumerable + Ownable
├── tests/
│   ├── conftest.py           # Fixture pytest (owner, alice, bob, ticket_nft)
│   └── test_ticket_nft.py    # 13 test: mint, batch, events, enumerable
├── scripts/
│   └── deploy.py             # Script di deploy + export ABI
└── deployments/
    └── ticket_nft.json       # Indirizzo + ABI (generato dal deploy)
```

## Prerequisiti

- Python >= 3.10
- [uv](https://docs.astral.sh/uv/) (package manager)
- Le dipendenze (`eth-ape`, `ape-solidity`) sono gestite nel `pyproject.toml` radice

```bash
cd /path/to/hackaton2026
uv sync
```

## Compilazione

```bash
cd contracts
uv run ape compile
```

OpenZeppelin 4.9.6 viene scaricato automaticamente alla prima compilazione.

## Test

```bash
cd contracts
uv run ape test -v
```

I test usano il provider in-memory `eth-tester` (nessun nodo necessario).

## Deploy

### Rete locale di test (eth-tester)

```bash
cd contracts
uv run ape run deploy
```

### Rete privata Geth (singolo host o LAN)

```bash
cd contracts
uv run ape run deploy --network ethereum:local:node
```

L'URI del nodo Geth si configura in `ape-config.yaml` (default: `http://localhost:8545`).
Per la LAN, cambiare l'URI in un IP raggiungibile (es. `http://192.168.2.208:8545`).

### Opzioni

| Variabile d'ambiente | Descrizione | Default |
|---|---|---|
| `DEPLOYER_ALIAS` | Alias dell'account importato con `ape accounts import` | test account 0 |
| `INITIAL_MINT` | Numero di biglietti da mintare al deployer al deploy | 0 |

Esempio con mint iniziale:

```bash
INITIAL_MINT=10 uv run ape run deploy --network ethereum:local:node
```

### Importare un account deployer

Per deployare sulla rete privata con una chiave specifica:

```bash
uv run ape accounts import my-deployer
# inserire la chiave privata e una passphrase

DEPLOYER_ALIAS=my-deployer uv run ape run deploy --network ethereum:local:node
```

## Output del deploy

Dopo il deploy, il file `deployments/ticket_nft.json` contiene:

```json
{
  "contract_name": "TicketNFT",
  "address": "0x...",
  "abi": [...]
}
```

Questo file va usato dal frontend e dall'API per interagire con il contratto.

## Contratto: TicketNFT

| Funzione | Accesso | Descrizione |
|---|---|---|
| `mint(to, tokenId)` | Solo owner | Crea un biglietto e lo assegna a `to` |
| `mintBatch(recipients[], tokenIds[])` | Solo owner | Mint multiplo in una transazione |
| `totalSupply()` | Pubblico | Numero totale di biglietti emessi |
| `tokenByIndex(index)` | Pubblico | Token ID alla posizione globale |
| `tokenOfOwnerByIndex(owner, index)` | Pubblico | Token ID alla posizione per owner |
| `ownerOf(tokenId)` | Pubblico | Proprietario del biglietto |
| `balanceOf(owner)` | Pubblico | Numero di biglietti di un indirizzo |

Tutti i trasferimenti (mint incluso) emettono l'evento `Transfer(from, to, tokenId)`.
