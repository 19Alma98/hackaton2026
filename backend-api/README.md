# Backend API — Ticket Marketplace

REST API che legge dalla blockchain privata (Geth / Clique) e serve dati al frontend React.

## Stack

- **FastAPI** — framework async con documentazione OpenAPI automatica
- **web3.py** v7 — interazione con i contratti TicketNFT e TicketMarketplace
- **pydantic-settings** — configurazione da variabili d'ambiente / `.env`

## Quick Start

```bash
# 1. Installa le dipendenze (dalla root del progetto)
uv add fastapi "uvicorn[standard]" web3 pydantic-settings python-dotenv

# 2. Copia e configura il file .env
cp backend-api/.env.example backend-api/.env

# 3. Avvia il server
cd backend-api
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Il server parte su `http://localhost:8000`.

### Swagger / OpenAPI

Documentazione interattiva disponibile a:

- **Swagger UI** — `http://localhost:8000/docs`
- **ReDoc** — `http://localhost:8000/redoc`

## Configurazione

Variabili d'ambiente (o file `backend-api/.env`):

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `RPC_URL` | `http://localhost:8545` | URL del nodo Geth RPC |
| `CHAIN_ID` | `1337` | Chain ID della rete privata |
| `NFT_CONTRACT_ADDRESS` | *(vuoto)* | Indirizzo TicketNFT (se vuoto, letto da deployment artifact) |
| `MARKETPLACE_CONTRACT_ADDRESS` | *(vuoto)* | Indirizzo TicketMarketplace (se vuoto, letto da deployment artifact) |
| `DEPLOYMENTS_DIR` | `../contracts/deployments` | Cartella contenente `ticket_nft.json` e `marketplace.json` |
| `CORS_ORIGINS` | `*` | Origini CORS consentite (separate da virgola) |

### Zero-config dopo il deploy

Se lasci vuoti `NFT_CONTRACT_ADDRESS` e `MARKETPLACE_CONTRACT_ADDRESS`, l'API legge automaticamente gli indirizzi e le ABI dai file in `DEPLOYMENTS_DIR` generati da `ape run deploy`.

---

## Catalogo Endpoint

### Blocks

#### `GET /api/blocks/latest`

Restituisce gli ultimi N blocchi della chain.

**Query parameters:**

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `count` | int | 10 | Numero di blocchi (1–100) |

**Risposta:**

```json
[
  {
    "number": 2164,
    "timestamp": 1773507394,
    "transaction_count": 0,
    "miner": "0x0000000000000000000000000000000000000000",
    "gas_used": 0,
    "gas_limit": 30000000,
    "hash": "0xd61c41b7...",
    "parent_hash": "0xf8d851b4..."
  }
]
```

---

### Events

#### `GET /api/events/listed`

Restituisce tutti gli eventi `Listed` emessi dal contratto Marketplace (biglietti messi in vendita).

**Query parameters:**

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `from_block` | int | 0 | Blocco di partenza per la scansione eventi |

**Risposta:**

```json
[
  {
    "seller": "0xf39Fd6e5...",
    "token_id": 1,
    "price_wei": "1000000000000000000",
    "block_number": 150,
    "transaction_hash": "0xabc123..."
  }
]
```

#### `GET /api/events/sold`

Restituisce tutti gli eventi `Sold` emessi dal contratto Marketplace (biglietti venduti).

**Query parameters:**

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `from_block` | int | 0 | Blocco di partenza per la scansione eventi |

**Risposta:**

```json
[
  {
    "seller": "0xf39Fd6e5...",
    "buyer": "0x70997970...",
    "token_id": 1,
    "price_wei": "1000000000000000000",
    "block_number": 155,
    "transaction_hash": "0xdef456..."
  }
]
```

---

### Wallets

#### `GET /api/wallets`

Restituisce informazioni sui wallet (balance, nonce).

- **Senza parametri**: restituisce tutti i wallet noti (da `blockchain/wallets/*.json`)
- **Con `address`**: restituisce info per quel singolo indirizzo

**Query parameters:**

| Parametro | Tipo | Default | Descrizione |
|-----------|------|---------|-------------|
| `address` | string | *(opzionale)* | Indirizzo Ethereum specifico da interrogare |

**Risposta:**

```json
[
  {
    "name": "seriea",
    "address": "0x2B492Bdb41c645D5bD260d04B0EbAe78662C6019",
    "balance_wei": "40000000000000000000",
    "balance_eth": 40.0,
    "nonce": 0
  }
]
```

---

### Tickets

#### `GET /api/tickets/user/{address}`

Restituisce tutti i biglietti (token ID) posseduti da un indirizzo.

Usa le funzioni ERC721Enumerable: `balanceOf` + `tokenOfOwnerByIndex`.

**Path parameters:**

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `address` | string | Indirizzo Ethereum del proprietario |

**Risposta:**

```json
[
  { "token_id": 1, "owner": "0xf39Fd6e5..." },
  { "token_id": 3, "owner": "0xf39Fd6e5..." }
]
```

#### `GET /api/tickets/for-sale`

Restituisce tutti i biglietti attualmente in vendita sul marketplace.

L'endpoint scansiona gli eventi `Listed`, esclude quelli che risultano in `Sold` o `ListingCancelled`, e verifica on-chain con `getListing()` che il listing sia ancora attivo.

**Risposta:**

```json
[
  {
    "token_id": 2,
    "seller": "0xf39Fd6e5...",
    "price_wei": "500000000000000000"
  }
]
```

---

### Config

#### `GET /api/config`

Restituisce la configurazione della chain per il frontend, evitando di hardcodare valori nel codice client.

**Risposta:**

```json
{
  "chain_id": 1337,
  "rpc_url": "http://localhost:8545",
  "nft_contract_address": "0x5FbDB2315...",
  "marketplace_contract_address": "0xe7f1725E..."
}
```

#### `GET /api/health`

Health check: verifica che l'API raggiunga il nodo RPC.

**Risposta:**

```json
{
  "status": "ok",
  "block_number": 2164,
  "rpc_url": "http://localhost:8545",
  "chain_id": 1337
}
```

Valori possibili per `status`: `"ok"` | `"rpc_unreachable"`.

---

## Struttura del progetto

```
backend-api/
  app/
    __init__.py
    main.py              # FastAPI app, CORS, lifespan
    config.py            # Pydantic Settings
    web3_provider.py     # Web3 singleton + POA middleware
    contracts.py         # TicketNFT e Marketplace contract instances
    schemas.py           # Pydantic response models
    routers/
      __init__.py
      blocks.py          # GET /api/blocks/latest
      events.py          # GET /api/events/listed, /api/events/sold
      tickets.py         # GET /api/tickets/user/{address}, /api/tickets/for-sale
      wallets.py         # GET /api/wallets
      app_config.py      # GET /api/config, /api/health
  .env.example
  README.md
```

## User Stories coperte

| ID | User Story | Endpoint |
|----|-----------|----------|
| US 5.1.1 | Ultimi N blocchi | `GET /api/blocks/latest?count=N` |
| US 5.1.2 | Eventi Listed / Sold | `GET /api/events/listed`, `GET /api/events/sold` |
| US 5.1.3 | Biglietti di un utente | `GET /api/tickets/user/{address}` |
| US 5.1.4 | Biglietti in vendita | `GET /api/tickets/for-sale` |
| US 5.2.1 | Usa web3.py | Tutte le route usano web3.py |
| US 5.2.2 | Singolo nodo RPC configurabile | `RPC_URL` in `.env` |
| US 5.3.1 | Configurazione via env | `.env` con RPC_URL, indirizzi, ABI |
| US 5.3.2 | Endpoint config per FE | `GET /api/config` |
