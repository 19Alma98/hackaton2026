# Deploy dei contratti – Guida operativa post-avvio nodi

Questa guida spiega **cosa fare dopo aver avviato i nodi** della rete blockchain privata. Va eseguita **da un solo PC** (il coordinatore, tipicamente PC 1).

> **Prerequisito:** la rete è attiva e `check_peers.py` conferma che tutti i nodi sono connessi. Se non avete ancora avviato i nodi, seguite prima il [RUNBOOK.md](blockchain/RUNBOOK.md).

---

## Panoramica del flusso

```
┌─────────────────────────────────────────────────────────────────────┐
│  I nodi sono attivi e connessi (check_peers.py → "All connected")  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ 1. Creare wallet    │
                    │    ente (se assente) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ 2. Finanziare il    │
                    │    wallet ente      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ 3. Importare ente   │
                    │    in Ape           │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ 4. Compilare i      │
                    │    contratti        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ 5. Deploy su rete   │
                    │    privata          │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ 6. Verificare e     │
                    │    distribuire JSON │
                    └──────────┘──────────┘
```

---

## Passo 0 – Verificare che la rete sia pronta

Prima di tutto, confermate che i nodi siano attivi e producano blocchi.

**Scenario single-host** (tutti i nodi su un PC):

```bash
cd blockchain
uv run python scripts/check_peers.py
```

**Scenario multi-PC (LAN):**

```bash
uv run python blockchain/scripts/check_peers.py \
    --hosts "192.168.2.208,192.168.3.230,192.168.2.165"
```

Output atteso:

```
Node     Endpoint                     Peers    Block  Status
--------------------------------------------------------------
nodo1    http://...:8545                  2        N  OK
nodo2    http://...:8545                  2        N  OK
nodo3    http://...:8545                  2        N  OK

Reachable: 3/3
All nodes fully connected.
```

Se `Block` non cresce o `Peers` è 0, consultate la sezione troubleshooting del [RUNBOOK.md](blockchain/RUNBOOK.md#troubleshooting).

---

## Passo 1 – Creare il wallet ente (se non esiste)

Il **wallet ente** è l'account dedicato che effettua il deploy dei contratti e minta i biglietti. È separato dai wallet dei nodi validatori.

```bash
uv run python blockchain/scripts/create_wallet.py ente --index 3 --genesis
```

Output:
- `blockchain/wallets/ente.json` — contiene indirizzo, chiave privata e keystore
- `blockchain/genesis.json` — aggiornato con l'alloc per l'ente (10 000 ETH)

> **Attenzione:** se la chain è **già stata avviata** e il genesis inizializzato, l'opzione `--genesis` aggiorna il file ma **non ha effetto retroattivo** sui nodi già avviati. In tal caso, passate al finanziamento post-avvio (passo 2B).

Verificate che il file sia stato creato:

```bash
cat blockchain/wallets/ente.json
```

Dovreste vedere qualcosa come:

```json
{
  "name": "ente",
  "address": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  "private_key": "0x..."
}
```

> Se il wallet `ente` esiste già da una sessione precedente, potete saltare questo passo.

---

## Passo 2 – Finanziare il wallet ente

Il wallet ente ha bisogno di ETH per pagare il gas delle transazioni (deploy contratti, mint biglietti).

### Opzione A – Genesis pre-fund (chain non ancora avviata)

Se avete creato il wallet con `--genesis` **prima** di avviare i nodi, l'ente è già finanziato nel genesis con 10 000 ETH. Non serve fare nulla.

### Opzione B – Trasferimento post-avvio (chain già attiva)

Se la chain è già attiva, trasferite ETH dal nodo 1 (che ha 10 000 ETH) al wallet ente:

```bash
uv run python blockchain/scripts/fund_wallet.py --to $(python -c "import json; print(json.load(open('blockchain/wallets/ente.json'))['address'])") --amount 500
```

Oppure specificando l'indirizzo direttamente:

```bash
uv run python blockchain/scripts/fund_wallet.py --to 0x2B492Bdb41c645D5bD260d04B0EbAe78662C6019 --amount 500
```

| Parametro | Descrizione | Default |
|---|---|---|
| `--rpc` | URL RPC del nodo | `http://localhost:8545` |
| `--from-key` | Chiave privata del mittente | Chiave di nodo 1 |
| `--to` | Indirizzo destinatario | Indirizzo da `wallets/ente.json` |
| `--amount` | ETH da trasferire | 100 |

> **LAN:** se il nodo RPC è su un altro PC, aggiungete `--rpc http://IP_PC1:8545`.

Verificate il saldo:

```bash
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x90F79bf6EB2c4f870365E785982E1f101E93b906","latest"],"id":1}'
```

Il `result` deve essere un valore hex > `0x0`.

---

## Passo 3 – Importare il wallet ente in Ape

Lo script di deploy usa Ape Framework per interagire con la chain. Il wallet ente va importato nel keyring locale di Ape.

```bash
cd contracts
uv run ape run import_ente
```

Vi verrà chiesta una **passphrase** per cifrare la chiave localmente. Scegliete qualcosa di semplice (es. `password`) — serve solo per confermare il deploy.

Se lo script automatico fallisce, importate manualmente:

```bash
uv run ape accounts import ente
# quando richiesto, incollate la chiave privata da blockchain/wallets/ente.json
```

Verificate che l'account sia stato importato:

```bash
uv run ape accounts list
```

Dovreste vedere `ente` nella lista. È normale vedere **solo** quell’account: `ape accounts list` mostra solo gli account importati nel keyring di Ape. I wallet dei nodi e i test account (es. in `blockchain/wallets/test_accounts.json`) non sono importati in Ape e quindi non compaiono; per il deploy serve solo l’account `ente`.

---

## Passo 4 – Compilare i contratti

```bash
cd contracts
uv run ape compile
```

Alla prima esecuzione, Ape scarica automaticamente OpenZeppelin 4.9.6. L'output deve mostrare la compilazione di `TicketNFT.sol` e `TicketMarketplace.sol` senza errori.

---

## Passo 5 – Deploy sulla rete privata

### Stesso PC del nodo (RPC su localhost)

```bash
cd contracts
uv run ape run deploy --network ethereum:local:node
```

### LAN – nodo RPC su un altro PC

```bash
cd contracts
RPC_URL=http://192.168.2.208:8545 uv run ape run deploy --network ethereum:local:node
```

### Con mint iniziale di biglietti

Per creare subito dei biglietti di test (utile per la demo):

```bash
cd contracts
INITIAL_MINT=10 uv run ape run deploy --network ethereum:local:node
```

### Opzioni complete

| Variabile d'ambiente | Descrizione | Default |
|---|---|---|
| `RPC_URL` | URL RPC del nodo Geth (per LAN) | da `ape-config.yaml` → `http://localhost:8545` |
| `DEPLOYER_ALIAS` | Alias dell'account in Ape | `ente` (se importato), altrimenti test account 0 |
| `INITIAL_MINT` | Biglietti da mintare al deploy | `0` |

### Output atteso

```
Network : local (provider: node)
RPC URI : http://localhost:8545
Chain ID: 1337
No DEPLOYER_ALIAS set, loaded 'ente' wallet: 0x90F79bf6...
Deploying Hacka (HAK) from 0x90F79bf6... ...
TicketNFT deployed at: 0xABC123...
Deploying TicketMarketplace (nft=0xABC123...) from 0x90F79bf6... ...
TicketMarketplace deployed at: 0xDEF456...
Deployment info saved to .../contracts/deployments/ticket_nft.json
Deployment info saved to .../contracts/deployments/marketplace.json
```

> **Se il deploy fallisce con "chain_id mismatch":** verificate che il `chainId` in `ape-config.yaml` sia `1337` (lo stesso del genesis).

---

## Passo 6 – Dove trovare gli indirizzi e le ABI dei contratti

Dopo il deploy, lo script genera automaticamente due file nella cartella `contracts/deployments/`:

```
contracts/
└── deployments/
    ├── ticket_nft.json        ← Indirizzo + ABI di TicketNFT
    └── marketplace.json       ← Indirizzo + ABI di TicketMarketplace
```

### Formato dei file

Ogni file ha questa struttura:

```json
{
  "contract_name": "TicketNFT",
  "address": "0x...",
  "abi": [...]
}
```

| Campo | Descrizione |
|---|---|
| `contract_name` | Nome del contratto Solidity |
| `address` | Indirizzo on-chain del contratto deployato |
| `abi` | Application Binary Interface — necessaria per chiamare le funzioni del contratto |

### Come usarli nel Frontend

Il frontend deve leggere `address` e `abi` da questi file per creare le istanze dei contratti via ethers.js / web3.js.

Esempio con ethers.js:

```javascript
import ticketNftData from './deployments/ticket_nft.json';
import marketplaceData from './deployments/marketplace.json';

const nftContract = new ethers.Contract(
  ticketNftData.address,
  ticketNftData.abi,
  signer
);

const marketplaceContract = new ethers.Contract(
  marketplaceData.address,
  marketplaceData.abi,
  signer
);
```

### Come usarli nel Backend API

L'API legge gli stessi file JSON per connettere web3.py ai contratti:

```python
import json
from web3 import Web3

w3 = Web3(Web3.HTTPProvider("http://localhost:8545"))

with open("contracts/deployments/ticket_nft.json") as f:
    nft_data = json.load(f)
nft_contract = w3.eth.contract(address=nft_data["address"], abi=nft_data["abi"])

with open("contracts/deployments/marketplace.json") as f:
    mkt_data = json.load(f)
marketplace_contract = w3.eth.contract(address=mkt_data["address"], abi=mkt_data["abi"])
```

### Conservazione e condivisione

| Scenario | Come gestire i file di deploy |
|---|---|
| **Single-host** (sviluppo) | I file sono già nella cartella `contracts/deployments/`, accessibili a tutti i componenti |
| **Multi-PC (LAN)** | Copiare i file JSON agli altri PC o metterli in una cartella condivisa in rete |
| **Git** | I file `deployments/*.json` **non** vanno committati (contengono indirizzi che cambiano a ogni deploy). Sono già nel `.gitignore` |
| **Variabili d'ambiente** | In alternativa, si possono estrarre gli indirizzi e passarli come env vars al FE/API |

Per estrarre rapidamente gli indirizzi dalla shell:

```bash
# Indirizzo TicketNFT
python -c "import json; print(json.load(open('contracts/deployments/ticket_nft.json'))['address'])"

# Indirizzo TicketMarketplace
python -c "import json; print(json.load(open('contracts/deployments/marketplace.json'))['address'])"
```

---

## Riepilogo comandi (copia-incolla)

Sequenza completa da eseguire **da un solo PC** dopo che tutti i nodi sono attivi:

```bash
# 0. Verificare la rete
uv run python blockchain/scripts/check_peers.py

# 1. Creare wallet ente (solo la prima volta)
uv run python blockchain/scripts/create_wallet.py ente --index 3 --genesis

# 2. Finanziare il wallet ente (se la chain era già attiva)
uv run python blockchain/scripts/fund_wallet.py --amount 500

# 3. Importare in Ape (solo la prima volta)
cd contracts
uv run ape run import_ente

# 4. Compilare
uv run ape compile

# 5. Deploy
uv run ape run deploy --network ethereum:local:node

# 6. Verificare gli indirizzi generati
cat deployments/ticket_nft.json | python -m json.tool
cat deployments/marketplace.json | python -m json.tool
```

Per LAN (nodo RPC su un altro PC), aggiungere `RPC_URL=http://IP_NODO:8545` prima del comando di deploy.

---

## Verifica post-deploy

Dopo il deploy, verificate che i contratti rispondano:

```bash
# Verificare che il contratto TicketNFT esista sulla chain
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getCode",
    "params":["INDIRIZZO_TICKET_NFT", "latest"],
    "id":1
  }'
```

Il `result` deve essere un bytecode hex lungo (non `0x`). Se il risultato è `0x`, il contratto non è stato deployato correttamente.

### Demo end-to-end (opzionale)

Per verificare l'intero flusso (mint, listing, acquisto):

```bash
cd contracts
uv run ape run marketplace_demo --network ethereum:local:node
```

La demo minta un biglietto, lo mette in vendita e lo acquista tra due wallet — confermando che token e marketplace funzionano.

### Stesso flusso via API (mint → approve → list → buy)

Per ottenere **lo stesso risultato** (mint, listing, acquisto) tramite le API del backend invece che con `marketplace_demo.py`:

1. **Prerequisiti**
   - Backend API in esecuzione (`cd backend-api && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`).
   - Contratti già deployati (TicketNFT + Marketplace).
   - Nel `.env` del backend:
     - `DEPLOYER_PRIVATE_KEY` (per il mint; oppure passi `deployer_private_key` nel body).
     - `CUSTODIAL_KEYS_JSON` con le chiavi private degli account che firmano: **venditore (Node1)** per approve e list, **compratore (Node2)** per buy.  
       Esempio (indirizzi e chiavi da `blockchain/wallets/test_accounts.json` o da Ape):  
       `CUSTODIAL_KEYS_JSON={"0x70997970c51812dc3a010c7d01b50e0d17dc79c8":"0x...","0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc":"0x..."}`

2. **Da dove viene `marketplace_contract_address`**  
   L’API restituisce `marketplace_contract_address` in `GET /api/config`. Il backend lo risolve così:
   - **Prima** usa la variabile d’ambiente `MARKETPLACE_CONTRACT_ADDRESS` (nel `.env` dell’istanza).
   - **Se è vuota** legge il file `marketplace.json` nella cartella dei deploy (`DEPLOYMENTS_DIR`, di default `contracts/deployments/`) e prende il campo `address`.

   **Se hai due nodi (due istanze API diverse)** l’indirizzo può essere **diverso** tra un nodo e l’altro perché ogni istanza ha il proprio `.env` e/o la propria copia di `contracts/deployments/` (magari da un deploy fatto su quella macchina). Per evitare incoerenze:
   - **Opzione consigliata:** imposta **esplicitamente** nel `.env` di **ogni** istanza backend lo stesso valore:
     - `MARKETPLACE_CONTRACT_ADDRESS=<indirizzo del Marketplace del deploy unico>`
     - `NFT_CONTRACT_ADDRESS=<indirizzo del TicketNFT dello stesso deploy>`
     Gli indirizzi "giusti" sono quelli prodotti dal deploy che usi sulla chain (es. l’output di `ape run deploy` o i `contracts/deployments/*.json` del PC che ha fatto il deploy). Così `GET /api/config` restituisce lo stesso `marketplace_contract_address` (e `nft_contract_address`) da tutti i nodi.
   - In alternativa: condividi la cartella `contracts/deployments/` (o i file `ticket_nft.json` e `marketplace.json`) su tutte le istanze; così il fallback da file è uguale per tutti.

   Per l’approve usa il valore `marketplace_contract_address` restituito da `GET /api/config` (dopo aver allineato le istanze come sopra).

3. **Chiamate in ordine** (stesso flusso della demo: mint → approve → list → buy).

| Step | Azione        | API | Body (esempio) |
|------|----------------|-----|----------------|
| 1    | **Mint**       | `POST /api/tickets/mint` | `{"recipient":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","count":1}` |
| 2    | **Approve**    | `POST /api/transfers/nft/approve` | `{"owner_address":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","approved_address":"<MARKETPLACE_CONTRACT_ADDRESS>","token_id":<TOKEN_ID>,"wait_for_receipt":true}` |
| 3    | **List**       | `POST /api/marketplace/list` | `{"seller_address":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","token_id":<TOKEN_ID>,"price_wei":"1000000000000000000","wait_for_receipt":true}` |
| 4    | **Buy**        | `POST /api/marketplace/buy` | `{"buyer_address":"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC","token_id":<TOKEN_ID>,"value_wei":"1000000000000000000","wait_for_receipt":true}` |

**Nota sui campi:**  
- **`recipient`** (mint): è l’indirizzo che **riceve** i token appena mintati, cioè ne diventa **proprietario**. Nell’esempio è Node1 (`0x70997970...79C8`, test account [1]): i token finiscono a lui, che poi li mette in vendita (list) e li cede al compratore (Node2) con buy.  
- **`<TOKEN_ID>`**: è l’ID restituito dal mint (es. `9001` se è il primo token mintato dopo i precedenti).  
- **`1000000000000000000`** wei = 1 ETH (come nella demo).

**Esempio completo con curl** (sostituisci `MARKETPLACE_ADDRESS` e `TOKEN_ID`):

```bash
# 1) Mint 1 token a Node1
curl -s -X POST http://localhost:8000/api/tickets/mint \
  -H "Content-Type: application/json" \
  -d '{"recipient":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","count":1}'
# Dalla risposta prendi minted_token_ids[0] come TOKEN_ID

# 2) Node1 approva il marketplace per quel token
curl -s -X POST http://localhost:8000/api/transfers/nft/approve \
  -H "Content-Type: application/json" \
  -d "{\"owner_address\":\"0x70997970C51812dc3A010C7d01b50e0d17dc79C8\",\"approved_address\":\"MARKETPLACE_ADDRESS\",\"token_id\":TOKEN_ID,\"wait_for_receipt\":true}"

# 3) Node1 mette in vendita a 1 ETH
curl -s -X POST http://localhost:8000/api/marketplace/list \
  -H "Content-Type: application/json" \
  -d "{\"seller_address\":\"0x70997970C51812dc3A010C7d01b50e0d17dc79C8\",\"token_id\":TOKEN_ID,\"price_wei\":\"1000000000000000000\",\"wait_for_receipt\":true}"

# 4) Node2 compra
curl -s -X POST http://localhost:8000/api/marketplace/buy \
  -H "Content-Type: application/json" \
  -d "{\"buyer_address\":\"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\",\"token_id\":TOKEN_ID,\"value_wei\":\"1000000000000000000\",\"wait_for_receipt\":true}"
```

Risultato atteso: come in terminale (token mintato a Node1, listato a 1 ETH, acquistato da Node2; nuovo owner = Node2, listing non più attiva). Per verificare: `GET /api/tickets/for-sale` e `GET /api/events/sold?from_block=0`.

Riferimento completo API: [backend-api/README.md](backend-api/README.md).

---

## Riferimenti rapidi

| Risorsa | Percorso |
|---|---|
| Contratti Solidity | `contracts/contracts/TicketNFT.sol`, `TicketMarketplace.sol` |
| Script di deploy | `contracts/scripts/deploy.py` |
| File di deploy (post-deploy) | `contracts/deployments/ticket_nft.json`, `marketplace.json` |
| Config Ape | `contracts/ape-config.yaml` |
| Wallet ente | `blockchain/wallets/ente.json` |
| Genesis | `blockchain/genesis.json` |
| Script import ente | `contracts/scripts/import_ente.py` |
| Demo marketplace | `contracts/scripts/marketplace_demo.py` |
| Runbook avvio nodi | `blockchain/RUNBOOK.md` |
| Setup LAN | `blockchain/LAN_SETUP.md` |

---

## Troubleshooting deploy

| Problema | Causa probabile | Soluzione |
|---|---|---|
| `chain_id mismatch` | `ape-config.yaml` ha un chainId diverso da 1337 | Verificare che `chain_id: 1337` in `ape-config.yaml` |
| `No DEPLOYER found` | Wallet ente non importato | Eseguire `uv run ape run import_ente` nella cartella `contracts/` |
| `insufficient funds for gas` | Wallet ente senza ETH | Finanziare con `fund_wallet.py --amount 500` |
| `connection refused` su RPC | Nodo non attivo o porta chiusa | Verificare che il nodo sia in esecuzione e la porta 8545 sia aperta |
| Timeout durante il deploy | Nessun sealer attivo che mina blocchi | Verificare che almeno un nodo abbia `--mine` e l'account sbloccato |
| `eth_getCode` restituisce `0x` | Deploy non riuscito o indirizzo errato | Ripetere il deploy e verificare l'output |
| `ProviderNotConnectedError` | Manca `--network ethereum:local:node` | Aggiungere il flag al comando di deploy |
| Deploy duplicato | Secondo deploy sovrascrive i JSON | I file in `deployments/` vengono sovrascritti; se serve il vecchio indirizzo, fare backup prima |
