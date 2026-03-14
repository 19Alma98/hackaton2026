# Feature e User Story – Backend Blockchain e Token Biglietti

Documento derivato dal piano `be_blockchain_e_token_e3cce470.plan.md`. Per ogni fase di sviluppo sono definite **feature** (capacità di prodotto) e **user story** (in formato “Come … vorrei … affinché …”).

---

## Dove entra il mio wallet MetaMask?

Nel piano ci sono **tre tipi** di "chiavi"/wallet; il **tuo MetaMask** è uno di questi.

| Ruolo | Cosa fa | Dove vive | È il tuo MetaMask? |
|-------|---------|-----------|--------------------|
| **Chiavi dei nodi** | Identità dei 5 container (validatori della rete). Servono solo per il consenso tra i nodi. | Generate da script, in volume/secret dei container. Non le usi tu. | No |
| **Wallet dell'ente** | Chi **emette** i biglietti (mint). Deploy dei contratti e chiamate `mint(to, tokenId)`. | Di solito una chiave in `.env` o un account dedicato (anche un secondo account MetaMask dell'organizzatore). | Solo se sei tu l'ente e usi un account MetaMask per mintare |
| **Wallet utente** | Chi **riceve**, **possiede**, **mette in vendita** e **acquista** i biglietti. | **Il tuo wallet normale, es. MetaMask.** | **Sì** |

Quindi: **il tuo MetaMask è il wallet utente**. Rientra così:

1. **Frontend**: l'app (dApp) si connette alla vostra rete privata e chiede a MetaMask di firmare le transazioni (acquisto, vendita, eventuale "approve" per il marketplace).
2. **Rete in MetaMask**: devi **aggiungere la vostra chain** in MetaMask (Rete personalizzata): RPC URL di uno dei 5 nodi (es. `http://IP_PC1:8545`) e **chainId** uguale a quello del genesis. Così MetaMask parla con la vostra blockchain e non con Ethereum mainnet.
3. **Ether per il gas**: sulla chain privata l'ether non ha valore "reale". Serve solo per pagare il gas. Va **preminato nel genesis** o trasferito da un account già finanziato (es. wallet ente) al tuo indirizzo MetaMask, così puoi fare transazioni.

In sintesi: **il backend espone la rete (RPC) e i contratti; il tuo MetaMask è il wallet con cui tu, come utente, possiedi i biglietti e fai compravendita.** Niente di quello che fai in MetaMask su mainnet viene toccato; usi lo stesso indirizzo su una rete diversa (la vostra privata).

---

## Fase 1: Ambiente e repository

### Feature 1.1 – Struttura progetto e prerequisiti

**Obiettivo:** Avere un repository pronto per lo sviluppo, con cartelle chiare e requisiti documentati.

| ID   | User story | Priorità |
|------|------------|----------|
| US 1.1.1 | Come **sviluppatore**, vorrei una struttura di cartelle (`blockchain/`, `contracts/`, `backend-api/`) così che io e il team sappiamo dove mettere codice e configurazioni. | Must |
| US 1.1.2 | Come **membro del team**, vorrei un documento dei prerequisiti (Docker, Docker Compose, Node.js) così che possa preparare il mio PC prima di iniziare. | Must |
| US 1.1.3 | Come **nuovo arrivato**, vorrei un README che spieghi come clonare il repo e avviare i 5 nodi così che possa contribuire senza conoscere la blockchain. | Must |
| US 1.1.4 | Come **frontend developer**, vorrei sapere come ottenere l’endpoint RPC di un nodo così che il frontend possa connettersi alla chain. | Must |

---

## Fase 2: Configurare la rete privata (5 nodi)

### Feature 2.1 – Genesis e consenso

**Obiettivo:** Definire la chain (genesis) e il set di validatori per il consenso.

| ID   | User story | Priorità |
|------|------------|----------|
| US 2.1.1 | Come **operatore della rete**, vorrei un file genesis condiviso (Clique/IBFT 2.0) così che tutti e 5 i nodi usino la stessa chain. | Must |
| US 2.1.2 | Come **operatore**, vorrei che i 5 indirizzi sealer/validator siano definiti in modo deterministico così che la configurazione sia ripetibile. | Should |

### Feature 2.2 – Chiavi e identità dei nodi

**Obiettivo:** Gestire in sicurezza le chiavi dei nodi senza committarle nel repo.

| ID   | User story | Priorità |
|------|------------|----------|
| US 2.2.1 | Come **operatore**, vorrei uno script che generi le chiavi dei 5 nodi così che non debba farlo a mano. | Must |
| US 2.2.2 | Come **team**, vorrei che le chiavi private restino in secret/volume dedicati e non nel repo così che non ci siano rischi di esposizione. | Must |

### Feature 2.3 – Container e immagine Docker

**Obiettivo:** Ogni nodo gira in un container con genesis, RPC e P2P esposti.

| ID   | User story | Priorità |
|------|------------|----------|
| US 2.3.1 | Come **operatore**, vorrei un’immagine Docker che avvii Geth/Besu in modalità private network così che un singolo comando porti su un nodo. | Must |
| US 2.3.2 | Come **frontend**, vorrei che la porta RPC (es. 8545) sia esposta così che possa interrogare lo stato della chain. | Must |
| US 2.3.3 | Come **rete**, vorrei che la porta P2P (es. 30303) sia esposta così che i 5 nodi si scoprano e si connettano tra loro. | Must |

### Feature 2.4 – Connessione tra i 5 PC

**Obiettivo:** Supportare sia “tutti su un PC” sia “5 PC separati” in LAN.

| ID   | User story | Priorità |
|------|------------|----------|
| US 2.4.1 | Come **team in test**, vorrei un docker-compose con 5 servizi (nodo1…nodo5) su un solo host così che possiamo provare la rete senza 5 macchine. | Must |
| US 2.4.2 | Come **operatore in hackathon**, vorrei istruzioni per avviare un nodo per PC con lista peer (IP:porta P2P o bootnode) così che i 5 PC formino una sola rete. | Must |
| US 2.4.3 | Come **operatore**, vorrei un modo per verificare che i nodi siano connessi (es. `admin.peers` o strumenti console) così che possa diagnosticare problemi di rete. | Should |

### Feature 2.5 – Documentazione rete

**Obiettivo:** Runbook operativo per avviare e verificare la rete.

| ID   | User story | Priorità |
|------|------------|----------|
| US 2.5.1 | Come **operatore sul PC 1**, vorrei istruzioni passo-passo (“lancio questo comando”) così che non debba interpretare la documentazione. | Must |
| US 2.5.2 | Come **operatore su PC 2–5**, vorrei istruzioni specifiche per il mio PC così che la sequenza di avvio sia chiara per tutti. | Must |

---

## Fase 3: Smart contract per i token (biglietti)

### Feature 3.1 – Token ERC-721 (biglietti)

**Obiettivo:** Un biglietto = un token non fungibile; l’ente può emettere (mint) biglietti.

| ID   | User story | Priorità |
|------|------------|----------|
| US 3.1.1 | Come **ente organizzatore**, vorrei poter creare (mintare) biglietti e assegnarli a un indirizzo così che possa distribuire i biglietti agli acquirenti. | Must |
| US 3.1.2 | Come **utente**, vorrei che ogni biglietto sia un token con un ID univoco (ERC-721) così che sia tracciabile e non fungibile. | Must |
| US 3.1.3 | Come **frontend**, vorrei ricevere eventi `Transfer` così che possa aggiornare la UI su acquisti e trasferimenti. | Must |
| US 3.1.4 | Come **frontend**, vorrei poter ottenere la lista di tutti i token (es. ERC721Enumerable) così che possa mostrare i biglietti esistenti. | Should |

### Feature 3.2 – Marketplace (compravendita)

**Obiettivo:** Mettere in vendita e acquistare biglietti on-chain.

| ID   | User story | Priorità |
|------|------------|----------|
| US 3.2.1 | Come **possessore di un biglietto**, vorrei metterlo in vendita indicando un prezzo (in ether o token) così che altri possano acquistarlo. | Must |
| US 3.2.2 | Come **acquirente**, vorrei pagare il prezzo e ricevere il token così che il biglietto passi a me e il pagamento al venditore. | Must |
| US 3.2.3 | Come **frontend**, vorrei eventi `Listed` e `Sold` così che possa mostrare annunci e vendite in tempo reale. | Must |
| US 3.2.4 | Come **venditore**, vorrei che il pagamento mi venga accreditato automaticamente alla vendita così che non serva un intermediario. | Must |

### Feature 3.3 – Test automatici contratti

**Obiettivo:** Validare logica di token e marketplace senza usare i 5 nodi.

| ID   | User story | Priorità |
|------|------------|----------|
| US 3.3.1 | Come **sviluppatore**, vorrei test Hardhat su rete locale che fanno deploy, mint, listing e acquisto così che possa iterare velocemente. | Must |
| US 3.3.2 | Come **team**, vorrei che i test verifichino i casi principali (mint solo owner, acquisto solo se prezzo pagato) così che non introduciamo regressioni. | Should |

---

## Fase 4: Deploy sulla rete privata

### Feature 4.1 – Configurazione Hardhat per rete privata

**Obiettivo:** Hardhat configurato per deploy sulla chain a 5 nodi.

| ID   | User story | Priorità |
|------|------------|----------|
| US 4.1.1 | Come **operatore**, vorrei una rete `private` in hardhat.config con URL RPC (es. `http://IP_PC1:8545`) e chainId del genesis così che il deploy punti alla nostra chain. | Must |
| US 4.1.2 | Come **team**, vorrei che il chainId in config coincida con il genesis così che non ci siano errori di rete. | Must |

### Feature 4.2 – Script di deploy e artefatti

**Obiettivo:** Deploy ripetibile e indirizzi/ABI disponibili per FE e API.

| ID   | User story | Priorità |
|------|------------|----------|
| US 4.2.1 | Come **operatore**, vorrei uno script che faccia deploy di ERC-721 e Marketplace (con indirizzo token al marketplace) così che un solo comando configuri la chain. | Must |
| US 4.2.2 | Come **operatore**, vorrei un mint iniziale opzionale per l’ente nello script così che ci siano biglietti da subito per test. | Should |
| US 4.2.3 | Come **frontend/API**, vorrei indirizzi dei contratti e ABI salvati in file (es. JSON) così che non debba cercarli a mano dopo ogni deploy. | Must |

### Feature 4.3 – Wallet ente e finanziamento

**Obiettivo:** Un wallet dedicato per l’ente che emette i biglietti, con ether per gas.

| ID   | User story | Priorità |
|------|------------|----------|
| US 4.3.1 | Come **ente**, vorrei un wallet dedicato per mint così che le operazioni di emissione siano tracciate e sicure. | Must |
| US 4.3.2 | Come **operatore**, vorrei che il wallet ente sia finanziato (genesis pre-minato o trasferimento) così che le transazioni di mint non falliscano per gas. | Must |
| US 4.3.3 | Come **team**, vorrei documentazione su come creare e finanziare il wallet ente così che sia ripetibile in altri ambienti. | Should |

### Feature 4.4 – Documentazione deploy

**Obiettivo:** Istruzioni chiare post-avvio nodi.

| ID   | User story | Priorità |
|------|------------|----------|
| US 4.4.1 | Come **operatore**, vorrei istruzioni del tipo “dopo aver avviato i 5 nodi, eseguite … da un solo PC” così che il deploy sia un processo definito. | Must |
| US 4.4.2 | Come **team**, vorrei sapere dove trovare e conservare indirizzo contratto token e marketplace così che FE e API li usino in modo coerente. | Must |

---

## Fase 5: Backend API (opzionale)

### Feature 5.1 – Endpoint per dati chain e token

**Obiettivo:** API REST che legge dalla chain e serve dati al frontend.

| ID   | User story | Priorità |
|------|------------|----------|
| US 5.1.1 | Come **frontend**, vorrei un endpoint “ultimi N blocchi” così che possa mostrare l’attività della chain. | Should |
| US 5.1.2 | Come **frontend**, vorrei endpoint per eventi Listed/Sold così che possa aggiornare la lista biglietti in vendita e lo storico vendite. | Must |
| US 5.1.3 | Come **utente**, vorrei un endpoint “biglietti di un utente” (per indirizzo) così che possa vedere i miei biglietti. | Must |
| US 5.1.4 | Come **acquirente**, vorrei un endpoint “lista biglietti in vendita” così che possa sfogliare il marketplace senza interrogare la chain direttamente. | Must |

### Feature 5.2 – Implementazione e connettività

**Obiettivo:** API che usa ethers.js (o web3.js) e si connette a un nodo RPC.

| ID   | User story | Priorità |
|------|------------|----------|
| US 5.2.1 | Come **sviluppatore API**, vorrei usare ethers.js per leggere eventi (log) e stato (balanceOf, getListing) così che l’implementazione sia standard. | Must |
| US 5.2.2 | Come **operatore**, vorrei che l’API legga da un solo nodo RPC (configurabile) così che non dipenda da tutti e 5 i nodi. | Must |

### Feature 5.3 – Configurazione e config per il FE

**Obiettivo:** URL RPC, indirizzi contratti e ABI in config; eventuale endpoint “config” per il FE.

| ID   | User story | Priorità |
|------|------------|----------|
| US 5.3.1 | Come **operatore**, vorrei configurare URL RPC, indirizzi token e marketplace e ABI via env/config così che l’API funzioni in ogni ambiente. | Must |
| US 5.3.2 | Come **frontend**, vorrei poter ottenere dalla API la “config” (indirizzo contratti, chainId) così che non debba hardcodare nel codice. | Should |

---

## Fase 6: Documentazione e runbook per il team

### Feature 6.1 – README completo

**Obiettivo:** Un solo punto di ingresso per capire il progetto e avviare tutto.

| ID   | User story | Priorità |
|------|------------|----------|
| US 6.1.1 | Come **nuovo membro**, vorrei capire in due minuti cosa fa il progetto (blockchain privata, token biglietti, marketplace) così che possa orientarmi. | Must |
| US 6.1.2 | Come **operatore**, vorrei prerequisiti (Docker, Node, npm/yarn) elencati chiaramente così che possa preparare l’ambiente. | Must |
| US 6.1.3 | Come **operatore**, vorrei istruzioni per “tutti i nodi su un PC” e “5 PC separati” così che possa scegliere lo scenario adatto. | Must |
| US 6.1.4 | Come **operatore**, vorrei sapere come deployare i contratti e dove trovare gli indirizzi così che il flusso sia completo. | Must |
| US 6.1.5 | Come **frontend**, vorrei sapere come avviare l’API (se presente) e come connettermi (RPC o API) così che l’integrazione sia chiara. | Must |

### Feature 6.2 – Glossario

**Obiettivo:** Lessico minimo per chi non ha esperienza blockchain.

| ID   | User story | Priorità |
|------|------------|----------|
| US 6.2.1 | Come **membro senza esperienza blockchain**, vorrei un glossario breve (genesis, nodo, RPC, wallet, ERC-721, mint, listing, gas) così che possa seguire le discussioni e la documentazione. | Should |

### Feature 6.3 – Troubleshooting

**Obiettivo:** Guida alla diagnosi dei problemi comuni.

| ID   | User story | Priorità |
|------|------------|----------|
| US 6.3.1 | Come **operatore**, vorrei una sezione “nodi non si vedono” (firewall, IP, porta P2P) così che possa risolvere problemi di connettività. | Should |
| US 6.3.2 | Come **operatore**, vorrei indicazioni su transazioni in pending (gas, sealer attivo) così che possa sbloccare le operazioni. | Should |
| US 6.3.3 | Come **frontend**, vorrei indicazioni se non vedo i contratti (chainId, indirizzo, RPC) così che possa verificare la configurazione. | Should |

---

## Riepilogo per fase

| Fase | Feature principali | User story (totale indicativo) |
|------|--------------------|---------------------------------|
| 1    | Struttura progetto, prerequisiti, README iniziale | 4 |
| 2    | Genesis, chiavi, Docker, connessione 5 PC, doc rete | 10 |
| 3    | ERC-721, Marketplace, test Hardhat | 8 |
| 4    | Hardhat private, script deploy, wallet ente, doc deploy | 8 |
| 5    | Endpoint API, implementazione ethers, config | 6 |
| 6    | README completo, glossario, troubleshooting | 8 |

**Legenda priorità:** Must = indispensabile per il deliverable; Should = consigliato per usabilità e manutenzione.

Se vuoi, il passo successivo può essere: (1) tradurre queste user story in ticket (es. Jira/Linear/issue) con criteri di accettazione, oppure (2) mappare le US sulle 6 fasi in uno sprint/backlog con stime.
