# Alternativa: usare una rete già attiva invece della blockchain privata su 5 nodi

Documento di supporto al piano `be_blockchain_e_token_e3cce470.plan.md`. Spiega **quando e come** appoggiarsi a una rete Ethereum già esistente (testnet o mainnet) se **non riuscite a creare la rete privata da zero** sui 5 PC del team.

---

## In sintesi

| Aspetto | Rete privata (5 nodi) | Rete già attiva (es. Ethereum testnet) |
|--------|------------------------|----------------------------------------|
| **Chi gestisce i nodi** | Voi (5 container, uno per PC) | Nessuno: la rete è già online |
| **Setup infrastruttura** | Genesis, Docker, P2P tra 5 PC, firewall | Solo configurare RPC e chainId nel codice |
| **Costo gas** | Gratuito (ether pre-minato da voi) | Testnet: faucet gratuito; mainnet: ETH reale |
| **Contratti** | Stessi (Solidity, ERC-721, marketplace) | **Identici**: stesso codice, stesso deploy |
| **MetaMask** | Aggiungere "rete personalizzata" (vostro RPC) | Selezionare Sepolia/Holesky (o mainnet) |
| **Ideale per** | Dimostrare "la nostra chain", controllo totale | Hackathon con poco tempo, evitare problemi di rete |

**Conclusione:** Se l'obiettivo è **far funzionare token e marketplace in poco tempo** e non avete vincoli di "rete privata", usare una **testnet Ethereum** (es. **Sepolia**) è più comodo e richiede zero gestione nodi. Il codice dei contratti e del frontend resta lo stesso; cambiano solo URL RPC, chainId e come si ottiene l'ether per il gas.

---

## Perché può essere più comodo appoggiarsi a una rete già attiva

1. **Niente infrastruttura da gestire**  
   Non dovete configurare genesis, 5 container, porte P2P, firewall, bootnode. La rete esiste già e ha migliaia di nodi.

2. **Niente problemi di "i nodi non si vedono"**  
   In hackathon, reti LAN, NAT e firewall spesso complicano la comunicazione tra i 5 PC. Con una testnet usate un RPC pubblico (o un servizio tipo Alchemy/Infura) e il frontend "parla" con la rete senza toccare i vostri PC.

3. **Stessi strumenti e stesso codice**  
   Solidity, Hardhat, OpenZeppelin, ethers.js, MetaMask funzionano uguale. Deploy e logica (ERC-721, marketplace) non cambiano; cambiano solo la **rete** in Hardhat e in MetaMask.

4. **Ether per il gas**  
   Sulle testnet l'ether non ha valore. Si ottiene da **faucet** gratuiti (es. per Sepolia). Nessun bisogno di pre-minare nel genesis o di distribuire ether a mano tra gli account.

5. **Tempo**  
   Potete concentrarvi su contratti, API e frontend invece che su "perché il nodo 3 non vede il nodo 1".

---

## Cosa cambia nell'implementazione (rete già attiva)

Quasi nulla a livello di **logica**. Ecco i punti che cambiano rispetto al piano "5 nodi".

### 1. Niente Fase 2 (rete privata)

- **Non** create genesis, **non** lanciate 5 container, **non** configurate P2P tra PC.
- Il "backend blockchain" si riduce a: **configurare l'URL RPC** e il **chainId** della rete che usate (es. Sepolia).

### 2. Configurazione Hardhat: una rete "esterna"

In `hardhat.config` invece della rete `private` (con IP del PC 1) avete una rete tipo:

```js
// Esempio: Sepolia
networks: {
  sepolia: {
    url: process.env.RPC_URL || "https://rpc.sepolia.org",
    chainId: 11155111,
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  },
}
```

- **RPC**: potete usare un endpoint pubblico (es. `https://rpc.sepolia.org`) o uno gratuito su [Alchemy](https://www.alchemy.com/), [Infura](https://www.infura.io/), [QuickNode](https://www.quicknode.com/) per avere rate limit più alti.
- **chainId**: Sepolia = 11155111; Holesky = 17000; Ethereum mainnet = 1.

### 3. Deploy

- Stesso script di deploy (ERC-721 + Marketplace), ma eseguito con:
  `npx hardhat run scripts/deploy.js --network sepolia`
- Il wallet che usa `PRIVATE_KEY` deve avere **ether sulla testnet** (da faucet). Nessun genesis, nessun pre-mining.

### 4. Wallet utente e MetaMask

- L'utente (e il frontend) sceglie in MetaMask la rete **Sepolia** (o quella che usate), non una "rete personalizzata" con l'IP del vostro nodo.
- Ogni utente deve avere un po' di ether sulla testnet per il gas (stessi faucet; potete indicarli nel README).

### 5. Backend API

- L'API si connette allo **stesso RPC** (es. `https://rpc.sepolia.org` o il vostro endpoint Alchemy/Infura). Stessa logica: ethers.js, lettura eventi, lettura stato contratti. Niente da cambiare nella logica applicativa.

### 6. Cosa non si fa

- Non si generano chiavi per 5 nodi.
- Non si espone porta RPC dal vostro PC (il frontend usa l'RPC pubblico o il vostro progetto su Alchemy/Infura).
- Non si gestisce consenso, genesis o Docker per la chain.

---

## Quale rete usare (testnet vs mainnet)

| Rete | chainId | Ether | Uso tipico |
|------|---------|--------|------------|
| **Sepolia** | 11155111 | Da faucet (gratis) | Test e hackathon; consigliata |
| **Holesky** | 17000 | Da faucet (gratis) | Alternativa testnet per staking/test |
| **Ethereum mainnet** | 1 | ETH reale | Produzione; costi gas reali |

Per un hackathon in cui **non** riuscite a far funzionare la rete privata, la scelta sensata è una **testnet** (es. **Sepolia**): zero costi, faucet facili, stessa EVM e stessi strumenti.

---

## Piano B: "Non riusciamo a far funzionare la rete privata"

Seguite questo percorso **alternativo** senza modificare contratti o logica; solo configurazione e passi operativi.

### Step 1: Scegliere la testnet e un RPC

- Scegliete **Sepolia** (o Holesky).
- Registrate un progetto gratuito su [Alchemy](https://www.alchemy.com/) o [Infura](https://www.infura.io/) e prendete l'URL RPC (es. `https://eth-sepolia.g.alchemy.com/v2/VOSTRO_KEY`). In alternativa usate l'RPC pubblico `https://rpc.sepolia.org`.

### Step 2: Configurare Hardhat per la testnet

- Aggiungete in `hardhat.config` la rete `sepolia` (o il nome che preferite) con `url` e `chainId` come sopra.
- Il deploy usa il wallet indicato da `PRIVATE_KEY` (wallet "ente"). Quel wallet deve avere ether su Sepolia.

### Step 3: Ottenere ether di test (faucet)

- Andate su un faucet per Sepolia, ad esempio:
  - [https://sepoliafaucet.com/](https://sepoliafaucet.com/) (Alchemy)
  - [https://www.alchemy.com/faucets/ethereum-sepolia](https://www.alchemy.com/faucets/ethereum-sepolia)
- Inserite l'indirizzo del wallet "ente" (e, per i test, anche gli indirizzi dei membri del team) e richiedete ether. In pochi minuti avrete ETH di test.

### Step 4: Deploy dei contratti

- Eseguite:  
  `npx hardhat run scripts/deploy.js --network sepolia`
- Salvate gli indirizzi dei contratti (e ABI) come già previsto dal piano (file JSON, env, o config per il frontend/API).

### Step 5: Frontend e MetaMask

- Nel frontend (e nella documentazione) indicate:
  - **Rete:** Sepolia (o la testnet scelta).
  - **RPC:** lo stesso che usate in Hardhat (o l'URL pubblico Sepolia).
  - **chainId:** 11155111 per Sepolia.
- Gli utenti in MetaMask selezionano "Sepolia" (rete già presente) invece di aggiungere una "rete personalizzata". Se usate un RPC custom (Alchemy/Infura), potete comunque aggiungere una "rete personalizzata" con quell'URL e chainId 11155111.

### Step 6: API backend

- L'API usa lo stesso RPC e gli stessi indirizzi contratti. Nessun cambiamento di logica; solo configurazione (env) con URL RPC e indirizzi aggiornati.

### Step 7: Documentare il piano B nel README

- Aggiungete una sezione tipo **"Piano B: uso di Sepolia (rete pubblica di test)"** con:
  - link al faucet,
  - comando di deploy per `sepolia`,
  - cosa mettere in MetaMask (rete + chainId),
  - dove trovare gli indirizzi dei contratti dopo il deploy.

---

## Confronto rapido: cosa tenete uguale e cosa no

| Elemento | Rete privata (5 nodi) | Rete già attiva (Sepolia) |
|----------|------------------------|----------------------------|
| Contratti Solidity (ERC-721, Marketplace) | ✅ Stessi | ✅ Stessi |
| Hardhat, OpenZeppelin, test | ✅ Stessi | ✅ Stessi |
| Script di deploy (logica) | ✅ Stesso | ✅ Stesso (solo `--network`) |
| Backend API (ethers, eventi, stato) | ✅ Stessa | ✅ Stessa (solo config RPC) |
| Frontend (Web3, MetaMask, chiamate) | ✅ Stesso | ✅ Stesso (solo rete MetaMask) |
| Genesis, Docker, 5 container, P2P | ✅ Sì | ❌ No |
| Gestione ether (pre-mining, distribuzione) | ✅ Manuale | ❌ Faucet |
| Esposizione porta RPC dal vostro PC | ✅ Sì (uno dei 5 nodi) | ❌ No (RPC pubblico/servizio) |

---

## Quando ha senso la rete privata e quando la rete già attiva

- **Rete privata (5 nodi)**  
  Ha senso se: (1) volete dimostrare di "aver tirato su una blockchain" e avete tempo per gestire nodi e rete; (2) avete requisiti di dati solo dentro la vostra rete (nessun dato su chain pubblica); (3) volete controllo totale su blocchi e costi (gas = 0).

- **Rete già attiva (testnet)**  
  Ha senso se: (1) l'obiettivo è far funzionare **token + marketplace** in fretta; (2) la rete privata non si riesce a far partire (firewall, tempo, complessità); (3) va bene che i dati siano su una chain pubblica di test (Sepolia è comunque "di prova" e l'ether non ha valore).

---

## Riepilogo deliverable con "rete già attiva"

Se adottate il piano B (rete già attiva, es. Sepolia):

- **Non** servono: genesis, Docker per i 5 nodi, script per chiavi nodi, istruzioni "avvio nodo su PC 1–5", troubleshooting P2P/firewall.
- **Servono**: configurazione Hardhat per la testnet, wallet ente con ether da faucet, stesso script di deploy (con `--network sepolia`), stessi contratti e stessa API; README aggiornato con sezione "Piano B: uso di Sepolia" (o altra testnet) e link ai faucet.

In questo modo, se **non riuscite a creare la rete privata da zero**, avete un percorso chiaro e veloce per appoggiarvi a una rete già attiva (Ethereum testnet) senza riscrivere il progetto.
