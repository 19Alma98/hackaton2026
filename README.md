# Backend Blockchain e Token Biglietti

Repository per il backend della rete blockchain privata (5 nodi) e degli smart contract per i token-biglietti. Non serve conoscere la blockchain per clonare il repo e avviare i nodi: basta seguire i passi sotto.

## Struttura del progetto

| Cartella        | Contenuto |
|-----------------|-----------|
| **`blockchain/`** | Configurazione della rete: genesis, Docker, docker-compose per i 5 nodi. |
| **`contracts/`**  | Smart contract (Solidity) per biglietti e marketplace; tooling Brownie. |
| **`backend-api/`**| Eventuale API REST (Python) per il frontend. |
| **`docs/`**       | Documentazione (prerequisiti, istruzioni). |

## Prerequisiti

Prima di iniziare, prepara il PC con gli strumenti descritti in **[docs/PREREQUISITI.md](docs/PREREQUISITI.md)**:

- **Docker**
- **Docker Compose**
- **Python 3.x** (per Brownie e, se prevista, l’API)

Verifica rapida:

```bash
docker --version
docker compose version
python3 --version
```

## Come clonare il repository e avviare i 5 nodi

1. **Clona il repo**
   ```bash
   git clone <URL_DEL_REPOSITORY>
   cd hackaton2026
   ```

2. **Controlla i prerequisiti**  
   Segui [docs/PREREQUISITI.md](docs/PREREQUISITI.md) e verifica che Docker, Docker Compose e Python siano installati.

3. **Avvia i 5 nodi**
   Dalla root del progetto:
   ```bash
   cd blockchain
   docker compose up -d
   ```
   I cinque servizi (nodo1 … nodo5) verranno avviati. Nella Fase 2 del progetto qui saranno configurati i client Ethereum (Geth/Besu) con genesis e porte RPC/P2P; fino ad allora i container sono solo placeholder per verificare che l’ambiente funzioni.

4. **Verifica**
   ```bash
   docker compose ps
   ```
   Dovresti vedere i 5 servizi in esecuzione.

Per fermare i nodi: `docker compose down`.

## Endpoint RPC per il frontend

Il frontend (dApp) si connette alla chain tramite **RPC** verso uno dei nodi. Non serve parlare con tutti e 5: basta **un** nodo che espone la porta RPC.

- **Dove si ottiene l’endpoint:** l’endpoint RPC è l’indirizzo HTTP di un nodo che espone il servizio RPC (porta **8545** per convenzione).
- **Su un solo PC (sviluppo/test):** dopo `docker compose up` in `blockchain/`, il nodo 1 espone l’RPC sulla porta 8545 dell’host. L’URL da usare nel frontend è:
  ```text
  http://localhost:8545
  ```
- **Con 5 PC in LAN (hackathon):** ogni PC avvia il proprio nodo. Il frontend userà l’URL del nodo di uno dei PC, ad esempio:
  ```text
  http://<IP_PC1>:8545
  ```
  Sostituisci `<IP_PC1>` con l’indirizzo IP del PC che espone il nodo 1 (o un qualsiasi nodo con RPC esposta).
- **In MetaMask:** aggiungi una “Rete personalizzata” con:
  - **URL RPC:** `http://localhost:8545` (o `http://<IP_PC1>:8545` in LAN)
  - **Chain ID:** quello definito nel genesis (sarà documentato in `blockchain/` quando il genesis sarà pronto)

Così il frontend e MetaMask possono leggere lo stato della chain e inviare transazioni (acquisto/vendita biglietti) senza dover conoscere i dettagli della rete.

---

Per il piano di sviluppo e le user story si veda `be_blockchain_e_token_features_userstories.md`.
