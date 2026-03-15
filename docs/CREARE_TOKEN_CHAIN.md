# Creare un token sulla chain — Guida

In questo progetto il **token** è il **biglietto** (ERC-721) emesso dal contratto **TicketNFT**.  
Puoi:

1. **Mettere in piedi il contratto token** (deploy di TicketNFT + Marketplace) — una sola volta per rete.
2. **Creare singoli token** (mint di biglietti) — ogni volta che vuoi emettere nuovi biglietti.

---

## Parte 1 — Deploy del contratto token (prima volta)

Serve a “creare il token sulla chain”: viene deployato il contratto **TicketNFT** (e il **TicketMarketplace**).  
Dopo il deploy, l’indirizzo del contratto e l’ABI sono salvati in `contracts/deployments/`.

### Prerequisiti

- Nodi della rete privata attivi (es. `docker-compose up -d` in `blockchain/`).
- Wallet **ente** creato, finanziato e importato in Ape (vedi [DEPLOY_CONTRACTS.md](../DEPLOY_CONTRACTS.md) passi 1–3).

---

### Via command line (Ape)

1. **Compilare i contratti**
   ```bash
   cd contracts
   uv run ape compile
   ```

2. **Deploy sulla rete**
   - Stesso PC del nodo:
     ```bash
     uv run ape run deploy --network ethereum:local:node
     ```
   - Nodo su altro PC (LAN):
     ```bash
     RPC_URL=http://IP_NODO:8545 uv run ape run deploy --network ethereum:local:node
     ```

3. **Opzionale — mint iniziale al deploy**
   Per creare subito dei biglietti (token) al deployer:
   ```bash
   INITIAL_MINT=10 uv run ape run deploy --network ethereum:local:node
   ```

4. **Variabili utili**
   | Variabile       | Descrizione                          | Default |
   |-----------------|--------------------------------------|--------|
   | `RPC_URL`       | URL RPC del nodo Geth                | da config |
   | `DEPLOYER_ALIAS`| Account Ape per il deploy            | `ente` |
   | `TOKEN_NAME`    | Nome del token (es. "Hacka")         | Hacka  |
   | `TOKEN_SYMBOL`  | Simbolo (es. "HAK")                  | HAK    |
   | `INITIAL_MINT`  | Numero di biglietti da mintare al deploy | 0  |

Output: indirizzi e ABI in `contracts/deployments/ticket_nft.json` e `marketplace.json`.

---

### Via API

L’API compila e fa il deploy di TicketNFT + TicketMarketplace (stesso risultato dello script Ape).

1. **Avviare il backend** (se non già attivo):
   ```bash
   cd backend-api
   uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Chiave deployer**  
   Imposta una delle due:
   - **Body:** `deployer_private_key` nella richiesta.
   - **Env:** `DEPLOYER_PRIVATE_KEY` in `backend-api/.env`.

3. **Chiamata**
   ```bash
   curl -X POST http://localhost:8000/api/deploy \
     -H "Content-Type: application/json" \
     -d '{
       "token_name": "Hacka",
       "token_symbol": "HAK",
       "initial_mint": 5,
       "deployer_private_key": "0x..."
     }'
   ```
   Se usi `DEPLOYER_PRIVATE_KEY` nel `.env`, puoi omettere la chiave nel body:
   ```bash
   curl -X POST http://localhost:8000/api/deploy \
     -H "Content-Type: application/json" \
     -d '{"token_name": "Hacka", "token_symbol": "HAK", "initial_mint": 5}'
   ```

4. **Risposta**
   ```json
   {
     "nft_address": "0x...",
     "marketplace_address": "0x...",
     "deployer": "0x...",
     "initial_mint": 5,
     "message": "Contracts deployed successfully"
   }
   ```
   I file in `contracts/deployments/` vengono aggiornati dall’API (stessa cartella usata dall’API se `DEPLOYMENTS_DIR` punta lì).

---

## Parte 2 — Creare nuovi token (mint biglietti)

Dopo che il contratto TicketNFT è stato deployato, puoi **mintare** nuovi biglietti (token) verso un indirizzo. Solo l’owner del contratto (chi ha fatto il deploy) può mintare.

---

### Via API (consigliato per il mint)

1. **Chiave owner**  
   Stessa logica del deploy: `deployer_private_key` nel body oppure `DEPLOYER_PRIVATE_KEY` nel `.env`.

2. **Endpoint**
   ```bash
   curl -X POST http://localhost:8000/api/tickets/mint \
     -H "Content-Type: application/json" \
     -d '{
       "recipient": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
       "count": 3,
       "deployer_private_key": "0x..."
     }'
   ```
   Con chiave in env:
   ```bash
   curl -X POST http://localhost:8000/api/tickets/mint \
     -H "Content-Type: application/json" \
     -d '{"recipient": "0x90F79bf6EB2c4f870365E785982E1f101E93b906", "count": 3}'
   ```

3. **Risposta**
   ```json
   {
     "recipient": "0x90F79bf6...",
     "minted_token_ids": [1, 2, 3],
     "transaction_hash": "0x...",
     "message": "..."
   }
   ```
   I token ID sono assegnati in sequenza a partire da `totalSupply + 1`.

---

### Via command line (mint)

- **Al momento del deploy:** usa `INITIAL_MINT` (vedi sopra); i token vanno al deployer.
- **Dopo il deploy:** non c’è uno script dedicato “solo mint” in `contracts/scripts`. Puoi:
  - usare l’**API** `POST /api/tickets/mint` (come sopra), oppure
  - usare la **demo** `marketplace_demo.py` che fa deploy + mint + list + buy (utile per test end-to-end, non per “solo mint” su un contratto già esistente).

Per un mint “solo da CLI” su un contratto già deployato si può aggiungere uno script Ape che legge l’indirizzo da `deployments/ticket_nft.json` e chiama `mint`/`mintBatch`; fino ad allora l’opzione più semplice è l’API.

---

## Riepilogo

| Azione | Command line | API |
|--------|----------------|-----|
| **Deploy contratto token** (TicketNFT + Marketplace) | `cd contracts && uv run ape run deploy --network ethereum:local:node` | `POST /api/deploy` |
| **Mint iniziale al deploy** | `INITIAL_MINT=N uv run ape run deploy ...` | `POST /api/deploy` con `initial_mint: N` |
| **Mint nuovi biglietti** (dopo il deploy) | Usare API o script custom | `POST /api/tickets/mint` con `recipient` e `count` |

Documentazione completa deploy: [DEPLOY_CONTRACTS.md](../DEPLOY_CONTRACTS.md).  
Catalogo API: [backend-api/README.md](../backend-api/README.md).
