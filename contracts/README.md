# Contracts

Smart contract ERC-721 per i token-biglietti e marketplace per la compravendita. Tooling: [Ape Framework](https://docs.apeworx.io/) con plugin `ape-solidity`.

## Struttura

```
contracts/
├── ape-config.yaml            # Configurazione Ape (dipendenze, solc, rete)
├── contracts/
│   ├── TicketNFT.sol          # ERC-721 Enumerable + Ownable
│   └── TicketMarketplace.sol  # Marketplace: listing, acquisto, offerte
├── tests/
│   ├── conftest.py            # Fixture pytest (owner, alice, bob, charlie, contratti)
│   ├── test_ticket_nft.py     # Test TicketNFT: mint, batch, events, enumerable
│   └── test_marketplace.py    # Test Marketplace: listing, buy, cancel, offerte
├── scripts/
│   ├── deploy.py              # Script di deploy + export ABI
│   └── marketplace_demo.py    # Demo end-to-end: mint → list → buy
└── deployments/
    ├── ticket_nft.json        # Indirizzo + ABI TicketNFT (generato dal deploy)
    └── marketplace.json       # Indirizzo + ABI TicketMarketplace (generato dal deploy)
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

I test usano il provider in-memory `eth-tester` (nessun nodo necessario). La suite copre sia TicketNFT (mint, batch, events, enumerable) sia TicketMarketplace (listing, buy, cancel, offerte con accept/reject/withdraw).

## Deploy

### Rete locale di test (eth-tester)

```bash
cd contracts
uv run ape run deploy
```

### Rete privata Geth (stesso PC)

Se il nodo Geth gira sulla stessa macchina (porta 8545 di default):

```bash
cd contracts
uv run ape run deploy --network ethereum:local:node
```

### Rete privata Geth (LAN – nodo su un altro PC)

Per puntare a un nodo Geth su un altro PC in LAN, usa la variabile `RPC_URL`:

```bash
cd contracts
RPC_URL=http://192.168.2.208:8545 uv run ape run deploy --network ethereum:local:node
```

Lo script sovrascrive l'URI del provider a runtime. Se `RPC_URL` non è impostata, usa il valore di `ape-config.yaml` (`http://localhost:8545`).

> **chainId**: lo script verifica che il chainId della chain connessa corrisponda a quello del genesis (`1337`). Se non corrispondono, il deploy viene interrotto con un messaggio di errore.

### Opzioni

| Variabile d'ambiente | Descrizione | Default |
|---|---|---|
| `RPC_URL` | URL RPC del nodo Geth (override per LAN) | da `ape-config.yaml` |
| `DEPLOYER_ALIAS` | Alias dell'account importato con `ape accounts import` | test account 0 |
| `INITIAL_MINT` | Numero di biglietti da mintare al deployer al deploy | 0 |

Esempio completo (LAN + account + mint iniziale):

```bash
RPC_URL=http://192.168.2.208:8545 \
  DEPLOYER_ALIAS=my-deployer \
  INITIAL_MINT=10 \
  uv run ape run deploy --network ethereum:local:node
```

### Importare un account deployer

Per deployare sulla rete privata con una chiave specifica:

```bash
uv run ape accounts import my-deployer
# inserire la chiave privata e una passphrase

DEPLOYER_ALIAS=my-deployer uv run ape run deploy --network ethereum:local:node
```

## Wallet Ente (Emissione Biglietti)

Il **wallet ente** è un account dedicato all'organizzazione che emette i biglietti (deploy dei contratti e mint). È separato dai nodi validatori per tracciabilità e sicurezza.

### Come viene creato

Il wallet ente si crea con `create_wallet.py`, **senza** rigenerare le chiavi dei nodi:

```bash
# Deterministico (mnemonic indice 3) + pre-fund nel genesis
uv run python blockchain/scripts/create_wallet.py ente --index 3 --genesis
```

Output:
- `blockchain/wallets/ente.json` — indirizzo, chiave privata, keystore
- `blockchain/genesis.json` — aggiornato con l'alloc per l'ente (10 000 ETH)

Si può anche creare con chiave random (senza `--index`).

### Finanziamento

**Opzione A – Pre-fund in genesis (prima dell'avvio della chain)**

```bash
uv run python blockchain/scripts/create_wallet.py ente --index 3 --genesis
```

Aggiunge l'indirizzo al genesis con 10 000 ETH. Usare **prima** di avviare i nodi (`docker compose up`).

**Opzione B – Trasferimento post-avvio**

Se la chain è già attiva, finanziare il wallet con un trasferimento da node 1:

```bash
# Al momento della creazione
uv run python blockchain/scripts/create_wallet.py ente --index 3 --fund 100

# Oppure in un secondo momento con fund_wallet.py
uv run python blockchain/scripts/fund_wallet.py --to 0x90F79bf6... --amount 500
```

| Parametro | Descrizione | Default |
|---|---|---|
| `--rpc` | URL RPC del nodo Geth | `http://localhost:8545` |
| `--from-key` | Chiave privata del mittente (hex) | Chiave di node 1 |
| `--to` | Indirizzo destinatario | Indirizzo ente da `wallets/ente.json` |
| `--amount` | ETH da trasferire | 100 |

### Creare wallet aggiuntivi

Lo stesso script crea qualsiasi wallet senza toccare chiavi esistenti:

```bash
# Wallet random
uv run python blockchain/scripts/create_wallet.py alice

# Wallet deterministico (indice 10) + fund 50 ETH
uv run python blockchain/scripts/create_wallet.py bob --index 10 --fund 50

# Listare tutti i wallet creati
uv run python blockchain/scripts/create_wallet.py --list
```

### Importare il wallet ente in Ape

Per usare il wallet ente come deployer, importalo nel keyring di Ape:

```bash
cd contracts
uv run ape run import_ente
```

Lo script legge la chiave privata da `blockchain/wallets/ente.json` e la importa con alias `ente`. Verrà richiesta una passphrase per cifrare la chiave localmente.

In alternativa, importa manualmente:

```bash
uv run ape accounts import ente
# incolla la chiave privata da wallets/ente.json
```

### Usare il wallet ente per il deploy

Dopo l'import, il wallet ente è il default se `DEPLOYER_ALIAS` non è impostato:

```bash
cd contracts
uv run ape run deploy --network ethereum:local:node
```

Oppure esplicitamente:

```bash
DEPLOYER_ALIAS=ente uv run ape run deploy --network ethereum:local:node
```

### Riprodurre in altri ambienti

1. Eseguire `generate_keys.py` per generare le chiavi nodo e il genesis
2. Creare il wallet ente: `create_wallet.py ente --index 3 --genesis`
3. L'indice 3 dalla stessa mnemonic produce sempre lo stesso indirizzo
4. Importare in Ape con `import_ente.py`
5. Se il genesis è già stato inizializzato, usare `--fund` o `fund_wallet.py`

## Output del deploy

Lo script genera due file nella cartella `deployments/`:

| File | Contratto |
|---|---|
| `ticket_nft.json` | TicketNFT |
| `marketplace.json` | TicketMarketplace |

Ogni file ha la stessa struttura:

```json
{
  "contract_name": "TicketNFT",
  "address": "0x...",
  "abi": [...]
}
```

Questi file vanno usati dal frontend e dall'API per interagire con i contratti.

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

## Contratto: TicketMarketplace

Il marketplace riceve l'indirizzo di `TicketNFT` al deploy. Supporta listing a prezzo fisso e offerte con escrow.

### Listing (prezzo fisso)

| Funzione | Accesso | Descrizione |
|---|---|---|
| `listTicket(tokenId, price)` | Owner del token | Mette in vendita un biglietto al prezzo indicato (richiede approval) |
| `cancelListing(tokenId)` | Venditore | Annulla la vendita |
| `buyTicket(tokenId)` | Chiunque (payable) | Acquista il biglietto al prezzo di listing; il pagamento va al venditore |
| `getListing(tokenId)` | Pubblico | Restituisce `(seller, price, active)` |

### Offerte (proposta / accettazione / rifiuto)

| Funzione | Accesso | Descrizione |
|---|---|---|
| `makeOffer(tokenId)` | Chiunque (payable) | Invia ETH come offerta; i fondi restano in escrow nel contratto |
| `acceptOffer(tokenId, buyer)` | Owner del token | Accetta l'offerta: NFT al buyer, ETH al venditore (richiede approval) |
| `rejectOffer(tokenId, buyer)` | Owner del token | Rifiuta l'offerta e rimborsa il buyer |
| `withdrawOffer(tokenId)` | Offerente | Ritira la propria offerta e recupera gli ETH |
| `getOffer(tokenId, buyer)` | Pubblico | Restituisce `(amount, active)` |

### Eventi

| Evento | Emesso quando |
|---|---|
| `Listed(seller, tokenId, price)` | Un biglietto viene messo in vendita |
| `Sold(seller, buyer, tokenId, price)` | Un biglietto viene acquistato via listing |
| `ListingCancelled(tokenId)` | Un listing viene annullato |
| `OfferMade(buyer, tokenId, amount)` | Un'offerta viene effettuata |
| `OfferAccepted(seller, buyer, tokenId, amount)` | Un'offerta viene accettata |
| `OfferRejected(seller, buyer, tokenId)` | Un'offerta viene rifiutata |
| `OfferWithdrawn(buyer, tokenId)` | Un'offerta viene ritirata dal buyer |

## Marketplace Demo

Lo script `scripts/marketplace_demo.py` esegue un flusso end-to-end: deploy (o caricamento contratti esistenti) → mint → approve → list → buy tra due wallet.

### Rete locale (automatico)

```bash
cd contracts
uv run ape run marketplace_demo
```

Usa test account; non serve configurazione.

### Rete privata Geth

```bash
cd contracts
NODE1_ALIAS=node1 NODE2_ALIAS=node2 DEPLOYER_ALIAS=deployer \
  uv run ape run marketplace_demo --network ethereum:local:node
```

### Rete privata Geth (LAN)

```bash
cd contracts
RPC_URL=http://192.168.2.208:8545 \
  NODE1_ALIAS=node1 NODE2_ALIAS=node2 DEPLOYER_ALIAS=deployer \
  uv run ape run marketplace_demo --network ethereum:local:node
```

### Opzioni demo

| Variabile d'ambiente | Descrizione | Default |
|---|---|---|
| `RPC_URL` | URL RPC del nodo Geth (override per LAN) | da `ape-config.yaml` |
| `DEPLOYER_ALIAS` | Alias account owner/minter | test account 0 |
| `NODE1_ALIAS` | Alias account venditore | test account 1 |
| `NODE2_ALIAS` | Alias account acquirente | test account 2 |
| `TOKEN_ID` | Token ID da mintare per la demo | 9001 |
| `PRICE` | Prezzo di listing in wei | 10^18 (1 ETH) |
