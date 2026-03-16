# MintPass Frontend — Overview & Reference

> Documentazione ufficiale del frontend per la demo Hackathon 2026.
> Stack: React 19 + TypeScript + Tailwind CSS 4 + Vite

---

## 1. Obiettivo Demo

**MintPass** è una dApp per la compravendita di biglietti come NFT ERC-721 su una blockchain privata Ethereum (Geth PoA).

### Cosa mostrare ai giudici

| # | Feature | Messaggio chiave |
|---|---------|-----------------|
| 1 | Lista utenti blockchain | Chi è registrato sulla chain |
| 2 | Marketplace eventi | Biglietti in vendita come NFT |
| 3 | Profilo wallet | ETH + biglietti posseduti |
| 4 | Acquisto con evidenza visiva | Transazione blockchain reale, non simulata |
| 5 | Identità senza login | La private key blockchain *è* la tua identità |
| 6 | Tracciabilità token | Storia completa del biglietto = anti-frode |

---

## 2. Stack Tecnico

| Componente | Scelta | Note |
|---|---|---|
| Framework | React 19 | |
| Build | Vite | |
| Linguaggio | TypeScript (strict) | |
| Styling | Tailwind CSS 4 | + custom CSS per blur/glow |
| Routing | React Router 7 | |
| Web3 | ethers.js 6 | solo `formatEther`, `formatUnits`, utils |
| API client | Axios | `axiosInstance.ts` centralizzato |
| State | React Context | `AuthContext` only (no Redux) |
| Test | Vitest + Testing Library | target 80% coverage |

---

## 3. Scenario Demo — Flusso Step-by-Step

```
1. Apri l'app → SelectIdentityPage
   └─ Vedi lista utenti blockchain (nome + indirizzo + ETH + n. ticket)
   └─ Scegli un utente → diventi quell'identità per la sessione

2. Arrivi alla DashboardPage
   ├─ Sezione WALLET (sx/top):
   │   └─ Il tuo indirizzo, ETH balance, biglietti NFT posseduti
   └─ Sezione MARKETPLACE (dx/main):
       └─ Biglietti in vendita → scegli un evento → clicca "Acquista"

3. Flusso acquisto:
   Step 1 → Modal di conferma (token_id, prezzo ETH, venditor)
   Step 2 → Animazione "transazione in corso" (spinner + hash atteso)
   Step 3 → Conferma: hash tx, success glow, wallet aggiornato

4. Clicca su un biglietto → TokenHistoryPage
   └─ Timeline degli eventi on-chain: mint → listed → sold → ...
   └─ Ogni step: from → to, timestamp, tx hash → anti-frode
```

---

## 4. Pagine

### `SelectIdentityPage` — `/`

**Scopo:** scegliere la propria identità blockchain (nessun login tradizionale).

- Chiama `GET /api/wallets` — mostra tutti gli utenti registrati
- Card per utente: nome, indirizzo troncato, ETH balance, n. ticket
- Click su una card → salva l'utente in `AuthContext` → redirect `/dashboard`
- Headline UI: *"La tua identità è la tua chiave blockchain — nessuna password."*

**Dati mostrati per ogni utente:**
```
name           (es. "alice", "ente_organizzatore")
address        (troncato: 0x1234...abcd)
balance_eth    (es. "12.50 ETH")
tokens[0].balance  (n. biglietti posseduti, se NFT deployato)
```

---

### `DashboardPage` — `/dashboard`

**Layout:** due sezioni visibili in parallelo.

#### Sezione Wallet (profilo utente corrente)
- Indirizzo con badge "Identità Blockchain"
- ETH balance
- Lista biglietti NFT posseduti (card compatte con token_id)
- Ogni biglietto → link a `TokenHistoryPage`

**API:** `GET /api/tickets/user/{address}` → lista `TicketInfo[]`
```ts
interface TicketInfo {
  token_id: number
  owner: string
}
```

#### Sezione Marketplace
- Lista biglietti in vendita (`ListingInfo[]`)
- Card: token_id, venditore (troncato), prezzo ETH
- Pulsante "Acquista" → avvia flusso acquisto

**API:** `GET /api/tickets/for-sale` → lista `ListingInfo[]`
```ts
interface ListingInfo {
  token_id: number
  seller: string
  price_wei: string   // converti con formatEther
}
```

#### Flusso Acquisto
```
1. Click "Acquista"
   → Bottom sheet di conferma:
     - Token ID: #42
     - Prezzo: 0.5 ETH
     - Venditore: 0xabcd...1234
     - [Conferma] [Annulla]

2. Click "Conferma"
   → POST /api/marketplace/buy
     body: { token_id, buyer_address, value_wei }
   → UI mostra TxAnimation:
     - Spinner animato
     - "Transazione inviata alla blockchain..."
     - Hash tx (appare quando disponibile)

3. Risposta ricevuta (TxResult)
   → Success: glow verde, toast "Biglietto acquistato!", wallet si aggiorna
   → Error: toast rosso con messaggio
```

**API acquisto:**
```
POST /api/marketplace/buy
Body: { token_id: number, buyer_address: string, value_wei: string }
Response: TxResult { tx_hash, status, block_number, ... }
```

---

### `TokenHistoryPage` — `/token/:tokenId`

**Scopo:** storia completa di un biglietto NFT → anti-frode, tracciabilità.

**Layout:**
- Header: token_id, owner corrente
- QR code del token (opzionale per demo)
- Timeline verticale: eventi on-chain in ordine cronologico

**Costruzione timeline** (combinando due API):
```
GET /api/events/listed  → EventListed[]  (quando è stato messo in vendita)
GET /api/events/sold    → EventSold[]    (quando è stato acquistato)
```

Filtrare per `token_id`, ordinare per `block_number`.

**Tipi di evento timeline:**
| Tipo | Icona | Dettagli |
|------|-------|----------|
| Listed | tag | seller, price_wei, block, tx_hash |
| Sold | check | seller → buyer, price_wei, block, tx_hash |

```ts
interface EventListed {
  seller: string
  token_id: number
  price_wei: string
  block_number: number
  transaction_hash: string
}

interface EventSold {
  seller: string
  buyer: string
  token_id: number
  price_wei: string
  block_number: number
  transaction_hash: string
}
```

> **Nota:** non esiste un endpoint `/api/events/{tokenId}` dedicato.
> Occorre chiamare `/api/events/listed` + `/api/events/sold` e filtrare client-side.

---

## 5. Componenti Condivisi

| Componente | File | Scopo |
|---|---|---|
| `GlassCard` | `components/GlassCard.tsx` | Card base glassmorphism (backdrop-blur, bordo semitrasparente) |
| `AddressChip` | `components/AddressChip.tsx` | Indirizzo troncato + bottone copia |
| `EthBadge` | `components/EthBadge.tsx` | Importo ETH formattato (da wei) |
| `TxAnimation` | `components/TxAnimation.tsx` | Animazione acquisto: spinner → hash → success |
| `UserAvatar` | `components/UserAvatar.tsx` | Avatar con gradient deterministico dall'indirizzo |
| `BottomSheet` | `components/BottomSheet.tsx` | Modal dal basso per conferma acquisto |
| `Toast` | `components/Toast.tsx` | Notifiche success/error |
| `Skeleton` | `components/Skeleton.tsx` | Loading states per cards e liste |

---

## 6. Context & Hooks

### `AuthContext` — `context/AuthContext.tsx`

```ts
interface AuthContextValue {
  currentUser: WalletInfo | null
  setCurrentUser: (user: WalletInfo) => void
  logout: () => void
}
```

Persistito in `sessionStorage` — si azzera alla chiusura della tab.

### Hook API

| Hook | File | Dati caricati |
|------|------|--------------|
| `useUsers` | `hooks/useUsers.ts` | `GET /api/wallets` |
| `useMarketplace` | `hooks/useMarketplace.ts` | `GET /api/tickets/for-sale` |
| `useWallet` | `hooks/useWallet.ts` | `GET /api/tickets/user/{address}` |
| `useTokenHistory` | `hooks/useTokenHistory.ts` | `GET /api/events/listed` + `/sold` filtrati per tokenId |

Pattern consigliato per ogni hook:
```ts
const { data, loading, error, refetch } = useMarketplace()
```

---

## 7. Design System

### Palette

```css
/* Background */
--bg-base: #050508;          /* gray-950 */
--bg-card: rgba(255,255,255,0.05);

/* Accenti */
--accent-primary: #8b5cf6;   /* violet-500 */
--accent-secondary: #d946ef; /* fuchsia-500 */
--success: #10b981;          /* emerald-500 */
--error: #f43f5e;            /* rose-500 */

/* Testo */
--text-primary: #f8fafc;     /* slate-50 */
--text-muted: #94a3b8;       /* slate-400 */
--text-mono: 'JetBrains Mono', monospace;
```

### GlassCard — stile base

```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
}
```

Tailwind equivalente: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl`

### Glow su acquisto (TxAnimation)

```css
.glow-success {
  box-shadow: 0 0 40px rgba(16, 185, 129, 0.4);  /* verde emerald */
}
.glow-pending {
  box-shadow: 0 0 40px rgba(139, 92, 246, 0.4);  /* violet */
}
```

### UserAvatar — gradient deterministico

Funzione in `utils/colors.ts`:
```ts
// Genera un gradient unico e ripetibile da un indirizzo Ethereum
export function addressToGradient(address: string): string {
  const h1 = parseInt(address.slice(2, 6), 16) % 360
  const h2 = (h1 + 60) % 360
  return `linear-gradient(135deg, hsl(${h1}, 70%, 50%), hsl(${h2}, 70%, 50%))`
}
```

### Tipografia

```
Titoli:     font-bold tracking-tight
Indirizzi:  font-mono text-sm text-slate-400
ETH:        font-mono font-semibold
Hash tx:    font-mono text-xs text-slate-500 truncate
```

### Animazioni

- **Transizione pagina:** `opacity-0 → opacity-100` con `transition-all duration-300`
- **Card hover:** `hover:bg-white/10 hover:border-white/20 transition-colors`
- **TxAnimation:** spinner CSS + flash verde su success
- **Loading skeleton:** `animate-pulse bg-white/10`

---

## 8. Struttura Directory

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── pages/
│   │   ├── SelectIdentityPage.tsx    # / — scelta identità blockchain
│   │   ├── DashboardPage.tsx         # /dashboard — wallet + marketplace
│   │   └── TokenHistoryPage.tsx      # /token/:tokenId — storia NFT
│   ├── components/
│   │   ├── GlassCard.tsx
│   │   ├── AddressChip.tsx
│   │   ├── EthBadge.tsx
│   │   ├── TxAnimation.tsx
│   │   ├── UserAvatar.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Toast.tsx
│   │   └── Skeleton.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useUsers.ts
│   │   ├── useMarketplace.ts
│   │   ├── useWallet.ts
│   │   └── useTokenHistory.ts
│   ├── api/
│   │   └── axiosInstance.ts          # Axios con baseURL da VITE_API_URL
│   ├── utils/
│   │   ├── format.ts                 # shortAddress, formatEth, formatDate
│   │   └── colors.ts                 # addressToGradient
│   ├── App.tsx                       # Router + AuthContext provider
│   └── main.tsx
├── .env.example
├── vite.config.ts
├── tsconfig.json
├── package.json
└── FRONTEND_OVERVIEW.md              # questo file
```

---

## 9. API Backend — Riferimento Completo

Tutte le chiamate vanno a `VITE_API_URL` (es. `http://192.168.1.x:8000`).

### Wallets

```
GET /api/wallets
  Query: ?address=0x...  (opzionale, filtra per indirizzo singolo)
  Response: WalletInfo[]

WalletInfo {
  name: string
  address: string          // checksum
  balance_wei: string
  balance_eth: number
  nonce: number
  tokens: TokenBalance[]   // NFT posseduti
}

TokenBalance {
  contract_address: string
  name: string
  symbol: string
  balance: number
  token_ids: number[]
}
```

### Tickets

```
GET /api/tickets/for-sale
  Response: ListingInfo[]

ListingInfo {
  token_id: number
  seller: string
  price_wei: string
}

GET /api/tickets/user/{address}
  Response: TicketInfo[]

TicketInfo {
  token_id: number
  owner: string
}
```

### Marketplace (write)

```
POST /api/marketplace/buy
  Body: { token_id: number, buyer_address: string, value_wei: string }
  Response: TxResult

TxResult {
  tx_hash: string | null
  status: string           // "success" | "pending" | "failed"
  block_number: number | null
  ...
}
```

### Events (per TokenHistoryPage)

```
GET /api/events/listed?from_block=0
  Response: EventListed[]

EventListed {
  seller: string
  token_id: number
  price_wei: string
  block_number: number
  transaction_hash: string
}

GET /api/events/sold?from_block=0
  Response: EventSold[]

EventSold {
  seller: string
  buyer: string
  token_id: number
  price_wei: string
  block_number: number
  transaction_hash: string
}
```

### Config & Health

```
GET /api/config
  Response: {
    chain_id: number
    rpc_url: string
    nft_contract_address: string
    marketplace_contract_address: string
  }

GET /api/health
  Response: { status: "ok"|"rpc_unreachable", block_number, rpc_url, chain_id }
```

---

## 10. Variabili d'Ambiente

File `.env.example`:
```
VITE_API_URL=http://<IP_BACKEND>:8000
VITE_CHAIN_ID=1337
VITE_RPC_URL=http://<IP_NODO1>:8545
```

Copia in `.env.local` e sostituisci gli IP reali prima di avviare.

---

## 11. Come Avviare il Progetto

```bash
# 1. Entra nella cartella frontend
cd frontend

# 2. Installa le dipendenze
npm install

# 3. Configura le variabili d'ambiente
cp .env.example .env.local
# → modifica VITE_API_URL con l'IP del backend

# 4. Avvia il dev server
npm run dev
# → http://localhost:5173

# 5. Build per la demo
npm run build
npm run preview
```

### package.json — dipendenze chiave

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "axios": "^1.7.0",
    "ethers": "^6.13.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0"
  }
}
```

---

## 12. Punti di Forza da Comunicare ai Giudici

1. **Nessun MetaMask** — il backend firma le transazioni (wallet custodial). Zero friction per l'utente finale.
2. **Identità = chiave blockchain** — nessun username/password. L'indirizzo Ethereum *è* l'identità.
3. **Anti-frode by design** — ogni biglietto ha una storia immutabile on-chain. Impossibile falsificare.
4. **Transazioni reali** — non è una simulazione: ogni acquisto è una vera tx Ethereum verificabile con hash.
5. **Privacy & trasparenza** — blockchain privata (non pubblica), ma con tutta la trasparenza degli smart contract.

---

## 13. TODO / Prossimi Passi

### Fase 1 — Struttura base
- [ ] `npm create vite@latest frontend -- --template react-ts`
- [ ] Configurare Tailwind CSS 4 + `@tailwindcss/vite`
- [ ] Configurare `axiosInstance.ts` con `baseURL` da `import.meta.env.VITE_API_URL`
- [ ] Implementare `AuthContext` + `PrivateRoute`
- [ ] Configurare React Router 7 con le 3 route

### Fase 2 — Componenti
- [ ] `GlassCard`, `Skeleton`, `Toast`
- [ ] `AddressChip` (copia negli appunti)
- [ ] `EthBadge` (formatEther da wei)
- [ ] `UserAvatar` (gradient da indirizzo)
- [ ] `BottomSheet` (confirm modal)
- [ ] `TxAnimation` (spinner → hash → success)

### Fase 3 — Pagine
- [ ] `SelectIdentityPage` — lista wallets, selezione identità
- [ ] `DashboardPage` — wallet sidebar + marketplace grid
- [ ] `TokenHistoryPage` — timeline eventi on-chain

### Fase 4 — Test & Polish
- [ ] Test Vitest per utils (`format.ts`, `colors.ts`)
- [ ] Test per hooks (mock axios)
- [ ] Verifica su mobile (layout responsive)
- [ ] Test end-to-end flusso acquisto manuale con backend live

### Da chiarire con il team backend
- [ ] Confermare IP/porta del backend per `.env.local`
- [ ] Chiedere se `GET /api/wallets` include già il nome utente (sì, campo `name`)
- [ ] Verificare che `wait_for_receipt: true` su `POST /api/marketplace/buy` attenda la conferma prima di rispondere
- [ ] Chiedere se esiste un endpoint per la storia di un singolo token (attualmente va composta con `/api/events/listed` + `/api/events/sold` filtrati per `token_id`)
