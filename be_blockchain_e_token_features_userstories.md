# Feature e User Story – Backend Blockchain e Token Biglietti

Documento derivato dal piano `be_blockchain_e_token_e3cce470.plan.md`. Per ogni fase di sviluppo sono definite **feature** (capacità di prodotto) e **user story** (in formato "Come … vorrei … affinché …").

> **Stato implementazione aggiornato al 15 marzo 2026.** Le colonne "Stato" indicano: ✅ Completato, 🔧 Parziale, ⏳ Pendente, ❌ Rimosso/Cambiato.

---

## Stack tecnologico attuale

| Layer | Tecnologia | Note |
|-------|------------|------|
| Smart Contracts | Solidity ^0.8.19, OpenZeppelin 4.9.6 | ERC721Enumerable + Ownable, ReentrancyGuard |
| Tooling contratti | **Ape Framework** + ape-solidity | Compilazione, test, deploy (sostituisce Brownie) |
| Backend API | **FastAPI** + web3.py v7 + pydantic-settings | REST API Python |
| Frontend | **React** + Vite + ethers.js | dApp con MetaMask |
| Package manager | uv (Astral) | Gestione dipendenze Python |
| Rete privata | Geth PoA (Clique) – 5 nodi Docker | chainId 1337 |

---

## Dove entra il mio wallet MetaMask?

Nel progetto ci sono **tre tipi** di "chiavi"/wallet; il **tuo MetaMask** è uno di questi.

| Ruolo | Cosa fa | Dove vive | È il tuo MetaMask? |
|-------|---------|-----------|--------------------|
| **Chiavi dei nodi** | Identità dei 5 container (validatori della rete). Servono solo per il consenso tra i nodi. | Generate da script (`generate_keys.py`), in volume/secret dei container. Non le usi tu. | No |
| **Wallet dell'ente** | Chi **emette** i biglietti (mint). Deploy dei contratti e chiamate `mint(to, tokenId)` / `mintBatch(recipients[], tokenIds[])`. | Creato con `create_wallet.py ente --index 3`, chiave in `blockchain/wallets/ente.json` oppure in `.env` come `DEPLOYER_PRIVATE_KEY`. | Solo se sei tu l'ente e usi un account MetaMask per mintare |
| **Wallet utente** | Chi **riceve**, **possiede**, **mette in vendita**, **fa offerte** e **acquista** i biglietti. | **Il tuo wallet normale, es. MetaMask.** | **Sì** |

Quindi: **il tuo MetaMask è il wallet utente**. Rientra così:

1. **Frontend**: l'app React (dApp) si connette alla vostra rete privata e chiede a MetaMask di firmare le transazioni (acquisto, vendita, offerte, eventuale "approve" per il marketplace).
2. **Rete in MetaMask**: devi **aggiungere la vostra chain** in MetaMask (Rete personalizzata): RPC URL di uno dei 5 nodi (es. `http://IP_PC1:8545`) e **chainId `1337`**. Così MetaMask parla con la vostra blockchain e non con Ethereum mainnet.
3. **Ether per il gas**: sulla chain privata l'ether non ha valore "reale". Serve solo per pagare il gas. Va **preminato nel genesis** o trasferito da un account già finanziato (es. wallet ente tramite `fund_wallet.py`) al tuo indirizzo MetaMask, così puoi fare transazioni.

In sintesi: **il backend espone la rete (RPC) e i contratti; il tuo MetaMask è il wallet con cui tu, come utente, possiedi i biglietti e fai compravendita.** Niente di quello che fai in MetaMask su mainnet viene toccato; usi lo stesso indirizzo su una rete diversa (la vostra privata).

---

## Fase 1: Ambiente e repository

### Feature 1.1 – Struttura progetto e prerequisiti

**Obiettivo:** Avere un repository pronto per lo sviluppo, con cartelle chiare e requisiti documentati.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 1.1.1 | Come **sviluppatore**, vorrei una struttura di cartelle (`blockchain/`, `contracts/`, `backend-api/`, `frontend/`) così che io e il team sappiamo dove mettere codice e configurazioni. | Must | ✅ |
| US 1.1.2 | Come **membro del team**, vorrei un documento dei prerequisiti (Docker, Docker Compose, Python >= 3.10, uv, Node.js) così che possa preparare il mio PC prima di iniziare. | Must | ✅ |
| US 1.1.3 | Come **nuovo arrivato**, vorrei un README che spieghi come clonare il repo e avviare i 5 nodi così che possa contribuire senza conoscere la blockchain. | Must | ✅ |
| US 1.1.4 | Come **frontend developer**, vorrei sapere come ottenere l'endpoint RPC di un nodo così che il frontend possa connettersi alla chain. | Must | ✅ |

**Note implementazione:** La struttura è `blockchain/` (nodi Geth), `contracts/` (Solidity + Ape), `backend-api/` (FastAPI), `frontend/` (React + Vite). Documentazione in `docs/PREREQUISITI.md`, `contracts/README.md`, `backend-api/README.md`.

---

## Fase 2: Configurare la rete privata (5 nodi)

### Feature 2.1 – Genesis e consenso

**Obiettivo:** Definire la chain (genesis) e il set di validatori per il consenso.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 2.1.1 | Come **operatore della rete**, vorrei un file genesis condiviso (Clique PoA) così che tutti e 5 i nodi usino la stessa chain con chainId `1337`. | Must | ✅ |
| US 2.1.2 | Come **operatore**, vorrei che i 5 indirizzi sealer/validator siano definiti in modo deterministico (mnemonic + indice) così che la configurazione sia ripetibile. | Should | ✅ |

### Feature 2.2 – Chiavi e identità dei nodi

**Obiettivo:** Gestire in sicurezza le chiavi dei nodi senza committarle nel repo.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 2.2.1 | Come **operatore**, vorrei uno script (`generate_keys.py`) che generi le chiavi dei 5 nodi così che non debba farlo a mano. | Must | ✅ |
| US 2.2.2 | Come **team**, vorrei che le chiavi private restino in secret/volume dedicati e non nel repo così che non ci siano rischi di esposizione. | Must | ✅ |

### Feature 2.3 – Container e immagine Docker

**Obiettivo:** Ogni nodo gira in un container con genesis, RPC e P2P esposti.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 2.3.1 | Come **operatore**, vorrei un'immagine Docker che avvii Geth in modalità Clique PoA così che un singolo comando porti su un nodo. | Must | ✅ |
| US 2.3.2 | Come **frontend/API**, vorrei che la porta RPC (8545) sia esposta così che possa interrogare lo stato della chain. | Must | ✅ |
| US 2.3.3 | Come **rete**, vorrei che la porta P2P (30303) sia esposta così che i 5 nodi si scoprano e si connettano tra loro. | Must | ✅ |

### Feature 2.4 – Connessione tra i 5 PC

**Obiettivo:** Supportare sia "tutti su un PC" sia "5 PC separati" in LAN.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 2.4.1 | Come **team in test**, vorrei un docker-compose con 5 servizi (nodo1…nodo5) su un solo host così che possiamo provare la rete senza 5 macchine. | Must | ✅ |
| US 2.4.2 | Come **operatore in hackathon**, vorrei istruzioni per avviare un nodo per PC con lista peer (IP:porta P2P o bootnode) così che i 5 PC formino una sola rete. | Must | ✅ |
| US 2.4.3 | Come **operatore**, vorrei un modo per verificare che i nodi siano connessi (es. `admin.peers`) così che possa diagnosticare problemi di rete. | Should | ✅ |

### Feature 2.5 – Documentazione rete

**Obiettivo:** Runbook operativo per avviare e verificare la rete.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 2.5.1 | Come **operatore sul PC 1**, vorrei istruzioni passo-passo ("lancio questo comando") così che non debba interpretare la documentazione. | Must | ✅ |
| US 2.5.2 | Come **operatore su PC 2–5**, vorrei istruzioni specifiche per il mio PC così che la sequenza di avvio sia chiara per tutti. | Must | ✅ |

---

## Fase 3: Smart contract per i token (biglietti)

### Feature 3.1 – Token ERC-721 (biglietti) – `TicketNFT.sol`

**Obiettivo:** Un biglietto = un token non fungibile; l'ente può emettere (mint) biglietti singolarmente o in batch.

**Contratto:** `TicketNFT` – ERC721Enumerable + Ownable (OpenZeppelin 4.9.6, Solidity ^0.8.19)

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 3.1.1 | Come **ente organizzatore**, vorrei poter creare (mintare) biglietti singoli con `mint(to, tokenId)` e assegnarli a un indirizzo così che possa distribuire i biglietti agli acquirenti. | Must | ✅ |
| US 3.1.2 | Come **ente organizzatore**, vorrei poter creare biglietti in batch con `mintBatch(recipients[], tokenIds[])` in una sola transazione così che l'emissione iniziale sia efficiente. | Must | ✅ |
| US 3.1.3 | Come **utente**, vorrei che ogni biglietto sia un token con un ID univoco (ERC-721 Enumerable) così che sia tracciabile e non fungibile. | Must | ✅ |
| US 3.1.4 | Come **frontend**, vorrei ricevere eventi `Transfer(from, to, tokenId)` così che possa aggiornare la UI su acquisti e trasferimenti. | Must | ✅ |
| US 3.1.5 | Come **frontend**, vorrei poter ottenere la lista di tutti i token (`totalSupply`, `tokenByIndex`, `tokenOfOwnerByIndex`, `balanceOf`, `ownerOf`) tramite ERC721Enumerable così che possa mostrare i biglietti esistenti. | Should | ✅ |

**Funzioni implementate:**

| Funzione | Accesso | Descrizione |
|---|---|---|
| `mint(to, tokenId)` | Solo owner | Crea un biglietto e lo assegna a `to` |
| `mintBatch(recipients[], tokenIds[])` | Solo owner | Mint multiplo in una transazione |
| `totalSupply()` | Pubblico | Numero totale di biglietti emessi |
| `tokenByIndex(index)` | Pubblico | Token ID alla posizione globale |
| `tokenOfOwnerByIndex(owner, index)` | Pubblico | Token ID alla posizione per owner |
| `ownerOf(tokenId)` | Pubblico | Proprietario del biglietto |
| `balanceOf(owner)` | Pubblico | Numero di biglietti di un indirizzo |

### Feature 3.2 – Marketplace (compravendita) – `TicketMarketplace.sol`

**Obiettivo:** Mettere in vendita e acquistare biglietti on-chain con prezzo fisso (listing) o tramite sistema di offerte con escrow.

**Contratto:** `TicketMarketplace` – ReentrancyGuard (Solidity ^0.8.19). Riceve l'indirizzo di `TicketNFT` al deploy.

#### 3.2.A – Listing (prezzo fisso)

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 3.2.1 | Come **possessore di un biglietto**, vorrei metterlo in vendita con `listTicket(tokenId, price)` indicando un prezzo in wei così che altri possano acquistarlo. Richiede approval preventiva al marketplace. | Must | ✅ |
| US 3.2.2 | Come **acquirente**, vorrei pagare il prezzo con `buyTicket(tokenId)` e ricevere il token così che il biglietto passi a me e il pagamento al venditore automaticamente. | Must | ✅ |
| US 3.2.3 | Come **venditore**, vorrei annullare la mia vendita con `cancelListing(tokenId)` così che possa ritirare il biglietto dal marketplace. | Must | ✅ |
| US 3.2.4 | Come **frontend**, vorrei eventi `Listed`, `Sold` e `ListingCancelled` così che possa mostrare annunci e vendite in tempo reale. | Must | ✅ |
| US 3.2.5 | Come **venditore**, vorrei che il pagamento mi venga accreditato automaticamente alla vendita così che non serva un intermediario. | Must | ✅ |
| US 3.2.6 | Come **frontend**, vorrei poter leggere i listing attivi con `getListing(tokenId)` → `(seller, price, active)` così che possa mostrare il marketplace. | Must | ✅ |

#### 3.2.B – Offerte con escrow (aggiunta rispetto al piano iniziale)

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 3.2.7 | Come **acquirente**, vorrei poter fare un'offerta con `makeOffer(tokenId)` inviando ETH che resta in escrow nel contratto, così che il venditore possa valutarla. | Must | ✅ |
| US 3.2.8 | Come **proprietario del biglietto**, vorrei accettare un'offerta con `acceptOffer(tokenId, buyer)` così che il NFT passi al buyer e gli ETH a me (richiede approval). | Must | ✅ |
| US 3.2.9 | Come **proprietario del biglietto**, vorrei rifiutare un'offerta con `rejectOffer(tokenId, buyer)` così che il buyer venga rimborsato automaticamente. | Must | ✅ |
| US 3.2.10 | Come **offerente**, vorrei ritirare la mia offerta con `withdrawOffer(tokenId)` così che possa recuperare i miei ETH se cambio idea. | Must | ✅ |
| US 3.2.11 | Come **frontend**, vorrei eventi `OfferMade`, `OfferAccepted`, `OfferRejected` e `OfferWithdrawn` così che possa aggiornare la UI sulle offerte. | Must | ✅ |
| US 3.2.12 | Come **frontend**, vorrei leggere le offerte con `getOffer(tokenId, buyer)` → `(amount, active)` così che possa mostrare lo stato delle offerte. | Must | ✅ |

**Tabella eventi marketplace completa:**

| Evento | Parametri | Emesso quando |
|---|---|---|
| `Listed(seller, tokenId, price)` | indexed seller, indexed tokenId, price | Un biglietto viene messo in vendita |
| `Sold(seller, buyer, tokenId, price)` | indexed seller, indexed buyer, indexed tokenId, price | Un biglietto viene acquistato via listing |
| `ListingCancelled(tokenId)` | indexed tokenId | Un listing viene annullato |
| `OfferMade(buyer, tokenId, amount)` | indexed buyer, indexed tokenId, amount | Un'offerta viene effettuata |
| `OfferAccepted(seller, buyer, tokenId, amount)` | indexed seller, indexed buyer, indexed tokenId, amount | Un'offerta viene accettata |
| `OfferRejected(seller, buyer, tokenId)` | indexed seller, indexed buyer, indexed tokenId | Un'offerta viene rifiutata |
| `OfferWithdrawn(buyer, tokenId)` | indexed buyer, indexed tokenId | Un'offerta viene ritirata dal buyer |

### Feature 3.3 – Test automatici contratti

**Obiettivo:** Validare logica di token e marketplace senza usare i 5 nodi.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 3.3.1 | Come **sviluppatore**, vorrei test Ape Framework (`ape test`) su provider in-memory `eth-tester` che coprano mint, batch, listing, acquisto, offerte, cancel, reject e withdraw così che possa iterare velocemente senza nodo. | Must | ✅ |
| US 3.3.2 | Come **team**, vorrei che i test verifichino i casi principali (mint solo owner, acquisto solo se prezzo pagato, offerte con escrow, reentrancy guard) così che non introduciamo regressioni. | Should | ✅ |
| US 3.3.3 | Come **sviluppatore**, vorrei fixture pytest condivise (`conftest.py` con owner, alice, bob, charlie, contratti) così che i test siano leggibili e DRY. | Should | ✅ |

**File test implementati:** `tests/test_ticket_nft.py`, `tests/test_marketplace.py`, `tests/conftest.py`.

---

## Fase 4: Deploy sulla rete privata

### Feature 4.1 – Configurazione Ape Framework per rete privata

**Obiettivo:** Ape Framework configurato per deploy sulla chain a 5 nodi.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 4.1.1 | Come **operatore**, vorrei una configurazione in `ape-config.yaml` con network `ethereum:local:node` e URL RPC (default `http://localhost:8545`, override via `RPC_URL`) così che il deploy punti alla nostra chain. | Must | ✅ |
| US 4.1.2 | Come **team**, vorrei che lo script di deploy verifichi che il chainId della chain connessa corrisponda a `1337` (genesis) così che non ci siano errori di rete. | Must | ✅ |

### Feature 4.2 – Script di deploy e artefatti

**Obiettivo:** Deploy ripetibile e indirizzi/ABI disponibili per FE e API.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 4.2.1 | Come **operatore**, vorrei uno script Python (`scripts/deploy.py`) che faccia deploy di TicketNFT e TicketMarketplace (con indirizzo NFT passato al marketplace) così che un solo comando configuri la chain. | Must | ✅ |
| US 4.2.2 | Come **operatore**, vorrei un mint iniziale opzionale tramite variabile `INITIAL_MINT` così che ci siano biglietti da subito per test. | Should | ✅ |
| US 4.2.3 | Come **frontend/API**, vorrei indirizzi dei contratti e ABI salvati in `deployments/ticket_nft.json` e `deployments/marketplace.json` così che non debba cercarli a mano dopo ogni deploy. | Must | ✅ |
| US 4.2.4 | Come **operatore**, vorrei poter fare il deploy anche tramite API (`POST /api/deploy`) passando parametri (nome token, simbolo, mint iniziale, chiave deployer) così che non serva accesso CLI alla macchina. | Should | ✅ |
| US 4.2.5 | Come **sviluppatore**, vorrei uno script demo end-to-end (`scripts/marketplace_demo.py`) che faccia deploy → mint → approve → list → buy così che possa verificare il flusso completo. | Should | ✅ |

**Variabili d'ambiente deploy:**

| Variabile | Descrizione | Default |
|---|---|---|
| `RPC_URL` | URL RPC del nodo Geth (override per LAN) | da `ape-config.yaml` |
| `DEPLOYER_ALIAS` | Alias dell'account importato con `ape accounts import` | test account 0 |
| `INITIAL_MINT` | Numero di biglietti da mintare al deployer al deploy | 0 |

### Feature 4.3 – Wallet ente e finanziamento

**Obiettivo:** Un wallet dedicato per l'ente che emette i biglietti, con ether per gas.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 4.3.1 | Come **ente**, vorrei un wallet dedicato creato con `create_wallet.py ente --index 3` (deterministico) così che le operazioni di emissione siano tracciate e sicure. | Must | ✅ |
| US 4.3.2 | Come **operatore**, vorrei poter finanziare il wallet ente pre-genesis (`--genesis` aggiunge 10 000 ETH all'alloc) o post-avvio (`--fund` o `fund_wallet.py`) così che le transazioni non falliscano per gas. | Must | ✅ |
| US 4.3.3 | Come **team**, vorrei poter creare wallet aggiuntivi (`create_wallet.py alice`, `create_wallet.py bob --index 10 --fund 50`) così che siano ripetibili in altri ambienti. | Should | ✅ |
| US 4.3.4 | Come **operatore**, vorrei importare il wallet ente in Ape con `ape run import_ente` così che possa usarlo come deployer. | Should | ✅ |

### Feature 4.4 – Documentazione deploy

**Obiettivo:** Istruzioni chiare post-avvio nodi.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 4.4.1 | Come **operatore**, vorrei istruzioni in `contracts/README.md` e `DEPLOY_CONTRACTS.md` del tipo "dopo aver avviato i 5 nodi, eseguite …" così che il deploy sia un processo definito. | Must | ✅ |
| US 4.4.2 | Come **team**, vorrei sapere dove trovare indirizzi e ABI (`deployments/*.json`) e come configurarli nell'API (`.env`) e nel frontend (`.env`) così che FE e API li usino in modo coerente. | Must | ✅ |

---

## Fase 5: Backend API (FastAPI)

### Feature 5.1 – Configurazione e health

**Obiettivo:** API REST configurabile che espone stato della chain e configurazione ai client.

**Stack:** FastAPI + web3.py v7 + pydantic-settings + CORS middleware + POA middleware.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 5.1.1 | Come **operatore**, vorrei configurare URL RPC, indirizzi contratti, chiavi deployer e CORS via `.env` / variabili d'ambiente così che l'API funzioni in ogni ambiente. | Must | ✅ |
| US 5.1.2 | Come **frontend**, vorrei un endpoint `GET /api/config` che restituisca `chain_id`, `rpc_url`, `nft_contract_address`, `marketplace_contract_address` così che non debba hardcodare nel codice. | Should | ✅ |
| US 5.1.3 | Come **operatore**, vorrei un endpoint `GET /api/health` che restituisca stato, block_number, rpc_url e chain_id così che possa verificare la connettività alla chain. | Must | ✅ |

**Configurazione `.env`:**

| Variabile | Default | Descrizione |
|---|---|---|
| `RPC_URL` | `http://localhost:8545` | URL RPC del nodo Geth |
| `CHAIN_ID` | `1337` | Chain ID della rete |
| `NFT_CONTRACT_ADDRESS` | `""` | Indirizzo TicketNFT (o da deployment JSON) |
| `MARKETPLACE_CONTRACT_ADDRESS` | `""` | Indirizzo TicketMarketplace |
| `DEPLOYER_PRIVATE_KEY` | `""` | Chiave privata deployer |
| `DEFAULT_SIGNER_PRIVATE_KEY` | `""` | Chiave di default per tx custodiali |
| `CUSTODIAL_KEYS_JSON` | `{}` | Mappa indirizzo → chiave privata per tx custodiali |
| `CORS_ORIGINS` | `*` | Origini CORS consentite |
| `DEPLOYMENTS_DIR` | `../contracts/deployments` | Cartella dei deployment JSON |
| `RECEIPT_TIMEOUT_SECONDS` | `30` | Timeout attesa receipt |

### Feature 5.2 – Endpoint blockchain e blocchi

**Obiettivo:** Esporre dati dalla chain.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 5.2.1 | Come **frontend**, vorrei un endpoint `GET /api/blocks/latest?count=N` che restituisca gli ultimi N blocchi (number, timestamp, transaction_count, miner, gas_used, hash) così che possa mostrare l'attività della chain. | Should | ✅ |

### Feature 5.3 – Endpoint deploy e mint

**Obiettivo:** Deploy e mint di biglietti via API senza accesso CLI.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 5.3.1 | Come **operatore**, vorrei un endpoint `POST /api/deploy` che faccia deploy di TicketNFT e Marketplace passando `token_name`, `token_symbol`, `initial_mint` e `deployer_private_key` così che il deploy sia possibile via API. | Should | ✅ |
| US 5.3.2 | Come **ente organizzatore**, vorrei un endpoint `POST /api/tickets/mint` che minti biglietti passando `recipient`, `count` e `deployer_private_key` così che possa emettere biglietti senza usare Ape CLI. | Must | ✅ |

### Feature 5.4 – Endpoint biglietti e marketplace (lettura)

**Obiettivo:** Leggere listing, eventi e stato dei biglietti dalla chain.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 5.4.1 | Come **acquirente**, vorrei un endpoint `GET /api/tickets/for-sale` che restituisca i biglietti in vendita (token_id, seller, price_wei) così che possa sfogliare il marketplace. | Must | ✅ |
| US 5.4.2 | Come **frontend**, vorrei un endpoint `GET /api/events/sold?from_block=N` che restituisca gli eventi Sold (seller, buyer, token_id, price_wei, block_number, tx_hash) così che possa mostrare lo storico vendite. | Must | ✅ |
| US 5.4.3 | Come **frontend**, vorrei un endpoint `GET /api/marketplace/listing/{token_id}` che restituisca lo stato di un listing (token_id, seller, price_wei, active) così che possa mostrare il dettaglio di una vendita. | Must | ✅ |
| US 5.4.4 | Come **frontend**, vorrei un endpoint `GET /api/marketplace/offers/{token_id}/{buyer_address}` che restituisca lo stato di un'offerta (token_id, buyer, amount_wei, active) così che possa mostrare le offerte ricevute/fatte. | Must | ✅ |

### Feature 5.5 – Endpoint wallet e utente

**Obiettivo:** Esporre informazioni wallet e bilancio token.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 5.5.1 | Come **utente**, vorrei un endpoint `GET /api/wallets?address=0x...` che restituisca i miei wallet con balance ETH, nonce e lista token (contract_address, name, symbol, token_ids) così che possa vedere i miei biglietti. | Must | ✅ |
| US 5.5.2 | Come **frontend**, vorrei un endpoint `GET /api/wallets` (senza filtro) che restituisca tutti i wallet conosciuti così che possa popolare un selettore. | Should | ✅ |

### Feature 5.6 – Endpoint trasferimenti (write custodiale)

**Obiettivo:** Eseguire trasferimenti ETH, NFT e approve tramite API con chiavi custodiali.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 5.6.1 | Come **operatore**, vorrei un endpoint `POST /api/transfers/eth` che trasferisca ETH tra indirizzi (from_address, to_address, amount_wei) così che possa finanziare wallet utente. | Must | ✅ |
| US 5.6.2 | Come **operatore**, vorrei un endpoint `POST /api/transfers/nft` che trasferisca un NFT (from_address, to_address, token_id) così che possa spostare biglietti tra wallet. | Must | ✅ |
| US 5.6.3 | Come **utente**, vorrei un endpoint `POST /api/transfers/nft/approve` che approvi un indirizzo (es. marketplace) per un token_id così che possa autorizzare la vendita. | Must | ✅ |
| US 5.6.4 | Come **frontend**, vorrei un endpoint `GET /api/transfers/tx/{tx_hash}` che restituisca lo stato di una transazione (status, block_number, gas_used, from, to, value) così che possa mostrare la conferma. | Must | ✅ |

### Feature 5.7 – Endpoint marketplace (write custodiale)

**Obiettivo:** Operazioni di listing e acquisto tramite API con chiavi custodiali.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 5.7.1 | Come **venditore**, vorrei un endpoint `POST /api/marketplace/list` (seller_address, token_id, price_wei) così che possa mettere in vendita un biglietto via API. | Must | ✅ |
| US 5.7.2 | Come **venditore**, vorrei un endpoint `POST /api/marketplace/cancel` (seller_address, token_id) così che possa annullare la vendita via API. | Must | ✅ |
| US 5.7.3 | Come **acquirente**, vorrei un endpoint `POST /api/marketplace/buy` (buyer_address, token_id, value_wei) così che possa acquistare un biglietto via API. | Must | ✅ |

### Feature 5.8 – Servizi interni e architettura

**Obiettivo:** Architettura backend modulare e manutenibile.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 5.8.1 | Come **sviluppatore**, vorrei un modulo `tx_service.py` centralizzato per la firma e invio transazioni (custodiali) con `send_native_transfer`, `send_contract_transaction`, `get_transaction_status` così che la logica di firma sia DRY. | Must | ✅ |
| US 5.8.2 | Come **sviluppatore**, vorrei un modulo `contracts.py` che carichi ABI e indirizzi da `deployments/*.json` con `get_nft_contract()`, `get_marketplace_contract()` e `reload_contracts()` così che i contratti siano sempre aggiornati. | Must | ✅ |
| US 5.8.3 | Come **sviluppatore**, vorrei un `web3_provider.py` singleton con supporto POA middleware (`ExtraDataToPOAMiddleware`) così che la connessione alla chain sia centralizzata e compatibile PoA. | Must | ✅ |

**Catalogo completo endpoint API:**

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/api/config` | Configurazione chain (chainId, RPC, indirizzi contratti) |
| GET | `/api/health` | Health check (stato, block_number) |
| GET | `/api/blocks/latest` | Ultimi N blocchi |
| POST | `/api/deploy` | Deploy contratti TicketNFT + Marketplace |
| POST | `/api/tickets/mint` | Mint biglietti |
| GET | `/api/tickets/for-sale` | Biglietti in vendita |
| GET | `/api/events/sold` | Eventi Sold |
| GET | `/api/wallets` | Lista wallet (filtro opzionale per address) |
| GET | `/api/transfers/tx/{tx_hash}` | Stato transazione |
| POST | `/api/transfers/eth` | Trasferimento ETH |
| POST | `/api/transfers/nft` | Trasferimento NFT |
| POST | `/api/transfers/nft/approve` | Approve NFT |
| GET | `/api/marketplace/listing/{token_id}` | Stato listing |
| GET | `/api/marketplace/offers/{token_id}/{buyer}` | Stato offerta |
| POST | `/api/marketplace/list` | Metti in vendita |
| POST | `/api/marketplace/cancel` | Annulla vendita |
| POST | `/api/marketplace/buy` | Acquista biglietto |

---

## Fase 6: Frontend (React + Vite + ethers.js)

### Feature 6.1 – Struttura e Web3 Context

**Obiettivo:** App React con connessione MetaMask e routing.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 6.1.1 | Come **utente**, vorrei una pagina di connessione MetaMask (`ConnectPage`) così che possa collegare il mio wallet alla dApp. | Must | ✅ |
| US 6.1.2 | Come **frontend**, vorrei un `Web3Context` che gestisca `address`, `provider`, `signer`, `currentChainId` e verifichi che la chain sia quella corretta (`VITE_CHAIN_ID=1337`) così che l'app sia sempre sincronizzata col wallet. | Must | ✅ |
| US 6.1.3 | Come **utente**, vorrei auto-reconnect e listener su `accountsChanged` / `chainChanged` così che non debba riconnettere il wallet se cambio account o rete. | Should | ✅ |
| US 6.1.4 | Come **utente**, vorrei un banner `WrongNetworkBanner` se la chain connessa non è quella corretta così che sappia di dover cambiare rete. | Should | ✅ |

### Feature 6.2 – Pagine e navigazione

**Obiettivo:** Pagine principali della dApp con layout mobile-first.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 6.2.1 | Come **utente**, vorrei una homepage (`/home`) con lista eventi così che possa sfogliare gli eventi disponibili. | Must | ✅ |
| US 6.2.2 | Come **utente**, vorrei una pagina evento (`/event/:id`) con dettaglio e biglietti disponibili così che possa scegliere quale acquistare. | Must | ✅ |
| US 6.2.3 | Come **utente**, vorrei una pagina "I miei biglietti" (`/tickets`) con lista dei miei token così che possa gestire i biglietti che possiedo. | Must | ✅ |
| US 6.2.4 | Come **utente**, vorrei una pagina dettaglio biglietto (`/ticket/:tokenId`) con opzioni di vendita così che possa mettere in vendita o visualizzare lo stato. | Must | ✅ |
| US 6.2.5 | Come **utente**, vorrei una pagina profilo (`/profile`) con il mio indirizzo e bilancio così che possa verificare il mio account. | Should | ✅ |
| US 6.2.6 | Come **utente**, vorrei un layout con `AppLayout`, `BottomNav` e `BottomSheet` così che l'esperienza mobile sia fluida. | Should | ✅ |

### Feature 6.3 – Integrazione contratti on-chain

**Obiettivo:** Sostituire i mock data con chiamate reali ai contratti.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 6.3.1 | Come **frontend**, vorrei leggere ABI e indirizzi contratti da `GET /api/config` o dai file di deployment così che la connessione ai contratti sia dinamica. | Must | ⏳ |
| US 6.3.2 | Come **utente**, vorrei che la lista biglietti in vendita arrivi dalla chain (non da mock) così che i dati siano reali. | Must | ⏳ |
| US 6.3.3 | Come **utente**, vorrei poter acquistare un biglietto firmando la transazione con MetaMask così che l'acquisto sia on-chain. | Must | ⏳ |
| US 6.3.4 | Come **utente**, vorrei poter mettere in vendita un biglietto (approve + list) firmando con MetaMask così che la vendita sia on-chain. | Must | ⏳ |
| US 6.3.5 | Come **utente**, vorrei poter fare, accettare, rifiutare e ritirare offerte firmando con MetaMask così che il sistema offerte sia on-chain. | Should | ⏳ |

**Nota:** Il frontend attualmente usa **mock data** (`frontend/src/mock/`). L'integrazione con i contratti reali è documentata nel piano `frontend/src/doc/plans/10-contract-integration.md` ed è bloccata in attesa del completamento dell'integrazione ABI/indirizzi.

---

## Fase 7: Documentazione e runbook per il team

### Feature 7.1 – README e documentazione

**Obiettivo:** Un solo punto di ingresso per capire il progetto e avviare tutto.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 7.1.1 | Come **nuovo membro**, vorrei capire in due minuti cosa fa il progetto (blockchain privata Geth, token biglietti ERC-721, marketplace con offerte) così che possa orientarmi. | Must | ✅ |
| US 7.1.2 | Come **operatore**, vorrei prerequisiti (Docker, Python >= 3.10, uv, Node.js) elencati in `docs/PREREQUISITI.md` così che possa preparare l'ambiente. | Must | ✅ |
| US 7.1.3 | Come **operatore**, vorrei istruzioni per "tutti i nodi su un PC" e "5 PC separati" così che possa scegliere lo scenario adatto. | Must | ✅ |
| US 7.1.4 | Come **operatore**, vorrei `DEPLOY_CONTRACTS.md` e `contracts/README.md` con istruzioni di deploy (Ape CLI e API) e dove trovare gli indirizzi (`deployments/*.json`) così che il flusso sia completo. | Must | ✅ |
| US 7.1.5 | Come **frontend**, vorrei `backend-api/README.md` con catalogo completo API e `docs/CREARE_TOKEN_CHAIN.md` per deploy e mint via API così che l'integrazione sia chiara. | Must | ✅ |

### Feature 7.2 – Glossario

**Obiettivo:** Lessico minimo per chi non ha esperienza blockchain.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 7.2.1 | Come **membro senza esperienza blockchain**, vorrei un glossario breve (genesis, nodo, RPC, wallet, ERC-721, mint, listing, gas, escrow, approval, PoA) così che possa seguire le discussioni e la documentazione. | Should | ⏳ |

### Feature 7.3 – Troubleshooting

**Obiettivo:** Guida alla diagnosi dei problemi comuni.

| ID   | User story | Priorità | Stato |
|------|------------|----------|-------|
| US 7.3.1 | Come **operatore**, vorrei una sezione "nodi non si vedono" (firewall, IP, porta P2P) così che possa risolvere problemi di connettività. | Should | ⏳ |
| US 7.3.2 | Come **operatore**, vorrei indicazioni su transazioni in pending (gas, sealer attivo) così che possa sbloccare le operazioni. | Should | ⏳ |
| US 7.3.3 | Come **frontend**, vorrei indicazioni se non vedo i contratti (chainId, indirizzo, RPC) così che possa verificare la configurazione. | Should | ⏳ |

---

## Contratti deployati (ultimo deploy)

| Contratto | Indirizzo | File |
|-----------|-----------|------|
| TicketNFT | `0x97f73F5f6e646420CF834E2B61E8E90854af3141` | `contracts/deployments/ticket_nft.json` |
| TicketMarketplace | `0x285f628B72F5B880a5ae5569be68bF57957c9a45` | `contracts/deployments/marketplace.json` |

---

## Riepilogo per fase

| Fase | Feature principali | User story | Stato |
|------|--------------------|-----------:|-------|
| 1 | Struttura progetto, prerequisiti, README iniziale | 4 | ✅ Completata |
| 2 | Genesis, chiavi, Docker, connessione 5 PC, doc rete | 10 | ✅ Completata |
| 3 | ERC-721 (mint + batch), Marketplace (listing + offerte), test Ape | 18 | ✅ Completata |
| 4 | Ape Framework, script deploy, wallet ente, doc deploy | 12 | ✅ Completata |
| 5 | FastAPI: config, health, blocks, deploy, mint, tickets, wallets, transfers, marketplace | 16 | ✅ Completata |
| 6 | React + Vite: Web3Context, pagine, layout (mock data; integrazione contratti pendente) | 11 | 🔧 Parziale |
| 7 | README, catalogo API, glossario, troubleshooting | 8 | 🔧 Parziale |

**Legenda:** ✅ Completato | 🔧 Parziale | ⏳ Pendente

**Prossimi passi:**
1. **Integrazione frontend–contratti**: sostituire mock data con chiamate reali via ethers.js + ABI/indirizzi da `/api/config`
2. **Glossario e troubleshooting**: completare la documentazione per il team
3. **Endpoint offerte API**: aggiungere endpoint per `makeOffer`, `acceptOffer`, `rejectOffer`, `withdrawOffer` nel backend
