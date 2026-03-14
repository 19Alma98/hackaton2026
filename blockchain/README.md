# Blockchain – Rete privata Geth Clique PoA (5 nodi)

Questa cartella contiene tutto il necessario per avviare una rete privata Ethereum a 5 nodi con consenso **Clique (Proof-of-Authority)** tramite **Geth** in container Docker.

## Struttura

| Percorso | Descrizione |
|----------|-------------|
| `genesis.json` | File genesis Clique condiviso da tutti i nodi |
| `static-nodes.json` | Enode URL dei 5 nodi per la peer discovery |
| `docker-compose.yml` | 5 servizi Geth (nodo1…nodo5) su rete Docker |
| `entrypoint.sh` | Script di avvio: init genesis + copia nodekey/static-nodes |
| `password.txt` | Password per sbloccare gli account dei sealer |
| `.env` | Variabili di configurazione (chainId, period) |
| `nodes/` | Chiavi dei nodi (gitignored, generato dallo script) |
| `scripts/generate_keys.py` | Script Python per generazione deterministica delle chiavi |

## Prerequisiti

- **Docker** e **Docker Compose** (v2)
- **Python 3.10+** e **uv** (per eseguire lo script di generazione chiavi)

## Quick start

### 1. Genera le chiavi e il genesis

Dalla **root del progetto** (`hackaton2026/`):

```bash
uv run python blockchain/scripts/generate_keys.py
```

Lo script genera:
- `blockchain/nodes/node{1-5}/keystore/` – keystore JSON per ogni nodo
- `blockchain/nodes/node{1-5}/nodekey` – chiave privata P2P per ogni nodo
- `blockchain/genesis.json` – genesis Clique con i 5 sealer
- `blockchain/static-nodes.json` – enode URL con nomi Docker
- `blockchain/password.txt` – password per lo sblocco account

I 5 indirizzi derivati dalla mnemonic di default (`test test test ... junk`):

| Nodo | Indirizzo |
|------|-----------|
| 1 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| 2 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| 3 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| 4 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |
| 5 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` |

Ogni account è pre-finanziato con **10 000 ETH** nel genesis.

### 2. Avvia i 5 nodi

```bash
cd blockchain
docker compose up -d
```

### 3. Verifica che i nodi siano attivi

```bash
docker compose ps
```

Tutti e 5 i servizi devono risultare in stato `running`.

### 4. Verifica la connessione tra i nodi

```bash
# Numero di peer del nodo 1 (atteso: 4)
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | python3 -m json.tool

# Dettaglio dei peer del nodo 1
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"admin_peers","params":[],"id":1}' | python3 -m json.tool
```

### 5. Verifica che i blocchi vengano prodotti

```bash
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Il numero di blocco dovrebbe crescere ogni ~5 secondi.

## Configurazione

| Parametro | Valore | Dove cambiarlo |
|-----------|--------|----------------|
| Chain ID | `1337` | `--chain-id` in `generate_keys.py`, poi rigenerare |
| Block period | `5` secondi | `--period` in `generate_keys.py`, poi rigenerare |
| Password keystore | `password` | `--password` in `generate_keys.py`, poi rigenerare |
| Mnemonic | Hardhat default | `--mnemonic` in `generate_keys.py` |

## Endpoint RPC

| Nodo | URL RPC |
|------|---------|
| nodo1 | `http://localhost:8545` |
| nodo2 | `http://localhost:8546` |
| nodo3 | `http://localhost:8547` |
| nodo4 | `http://localhost:8548` |
| nodo5 | `http://localhost:8549` |

Per il frontend e MetaMask basta connettersi a **un solo nodo** (es. `http://localhost:8545`).

### MetaMask – Rete personalizzata

- **Nome rete:** Hackathon Private
- **URL RPC:** `http://localhost:8545`
- **Chain ID:** `1337`
- **Simbolo valuta:** ETH

## Fermare e riavviare

```bash
# Fermare i nodi (i dati restano nei volumi Docker)
docker compose down

# Fermare e cancellare i dati (reset completo)
docker compose down -v
```

Dopo un `docker compose down -v`, il genesis viene re-inizializzato al prossimo `docker compose up`.

## Rigenerare le chiavi

Per usare una mnemonic diversa o cambiare parametri:

```bash
# Dalla root del progetto
rm -rf blockchain/nodes
uv run python blockchain/scripts/generate_keys.py --mnemonic "your twelve words here"
cd blockchain
docker compose down -v
docker compose up -d
```
