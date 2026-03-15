# Fase 0: Setup Progetto — Task Documentation

> MintPass Frontend | Hackathon 2026
> Branch: `test-frontend`
> Stato: TODO

---

## User Stories

### US-01: Avvio del dev server
**Come** sviluppatore frontend, **voglio** eseguire `npm run dev` nella cartella `frontend/` e vedere l'app avviarsi su `localhost:5173`, **così che** posso iniziare lo sviluppo incrementale.

**Acceptance Criteria:**
- [ ] `npm install` completa senza errori
- [ ] `npm run dev` avvia Vite su `http://localhost:5173`
- [ ] La pagina mostra contenuto React (non la pagina default di Vite)
- [ ] `npm run build` produce output senza errori TypeScript

---

### US-02: Design system dark + glassmorphism
**Come** sviluppatore frontend, **voglio** che il progetto abbia il tema dark con glassmorphism già configurato, **così che** ogni componente futuro eredita lo stile senza configurazione aggiuntiva.

**Acceptance Criteria:**
- [ ] Background della pagina è `#050508` (gray-950)
- [ ] Font JetBrains Mono caricato per elementi monospace
- [ ] CSS custom properties della palette definite (`--accent-primary`, `--success`, `--error`, ecc.)
- [ ] Classe `.glass-card` disponibile con `backdrop-blur` e bordo semitrasparente
- [ ] Tailwind CSS 4 funziona tramite `@tailwindcss/vite` plugin — **NON postcss**

---

### US-03: Health check con stato blockchain
**Come** presentatore alla demo, **voglio** vedere sulla pagina principale lo stato della connessione blockchain, **così che** posso dimostrare che il frontend comunica con il backend.

**Acceptance Criteria:**
- [ ] La pagina `/` chiama `GET /api/health` tramite `axiosInstance`
- [ ] Stato "ok": mostra pallino verde + "Blockchain connessa" + block_number, chain_id, rpc_url
- [ ] Stato "rpc_unreachable": mostra pallino rosso + messaggio
- [ ] Errore di rete: messaggio user-friendly, nessun crash
- [ ] Loading state visibile durante il fetch

---

### US-04: Routing configurato
**Come** sviluppatore frontend, **voglio** che React Router 7 sia configurato con le route del progetto, **così che** la navigazione è pronta per le fasi successive.

**Acceptance Criteria:**
- [ ] `/` → `SelectIdentityPage`
- [ ] `/dashboard` → `DashboardPage` (placeholder)
- [ ] `/token/:tokenId` → `TokenHistoryPage` (placeholder)
- [ ] Route inesistente → `NotFoundPage`
- [ ] Navigazione tra route funziona senza reload della pagina

---

### US-05: AuthContext pronto
**Come** sviluppatore frontend, **voglio** che l'`AuthContext` sia creato e wrappato nell'app, **così che** nelle fasi successive posso salvare l'identità selezionata senza modificare la struttura.

**Acceptance Criteria:**
- [ ] `AuthContext` espone `currentUser`, `setCurrentUser`, `logout`
- [ ] `currentUser` è `null` di default
- [ ] Provider wrappa tutta l'app in `App.tsx`
- [ ] `sessionStorage` usato per persistenza
- [ ] `useAuth()` fuori dal provider lancia un errore esplicito

---

### US-06: Axios configurato
**Come** sviluppatore frontend, **voglio** un'istanza Axios centralizzata con `baseURL` da variabile d'ambiente, **così che** tutte le chiamate API future usano un unico punto di configurazione.

**Acceptance Criteria:**
- [ ] `axiosInstance.ts` esporta istanza con `baseURL = import.meta.env.VITE_API_URL`
- [ ] Timeout impostato a 10 secondi
- [ ] `.env.example` presente con le 3 variabili (`VITE_API_URL`, `VITE_CHAIN_ID`, `VITE_RPC_URL`)
- [ ] Se `VITE_API_URL` non è definita → warning in console, nessun crash

---

## Task List

### F0-01 — Scaffolding Vite + React + TypeScript
**Stato:** TODO

**Descrizione:**
Inizializzare il progetto Vite con template `react-ts` dentro la cartella `frontend/` esistente. La cartella contiene già `FRONTEND_OVERVIEW.md` e `PHASE_0_TASKS.md` — Vite non li sovrascrive.

**Comandi:**
```bash
cd /c/Users/sergio.pugliese/Desktop/Repo/hackaton2026/frontend
npm create vite@latest . -- --template react-ts
# Quando chiede di procedere con file esistenti: confermare con Y
```

**File generati:**
- `package.json`
- `vite.config.ts`
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- `index.html`
- `src/main.tsx`, `src/App.tsx`, `src/App.css`
- `src/assets/react.svg`, `public/vite.svg`

**Definition of Done:**
- `npm run dev` avvia il server su porta 5173
- `npm run build` compila senza errori
- `FRONTEND_OVERVIEW.md` e `PHASE_0_TASKS.md` non sono stati toccati

**Dipendenze:** nessuna

---

### F0-02 — Installare dipendenze runtime
**Stato:** TODO

**Descrizione:**
Aggiungere le dipendenze di produzione.

**Comandi:**
```bash
cd /c/Users/sergio.pugliese/Desktop/Repo/hackaton2026/frontend
npm install react-router-dom@^7.0.0 axios@^1.7.0 ethers@^6.13.0
```

**Definition of Done:**
- `package.json` contiene `react-router-dom`, `axios`, `ethers` in `dependencies`
- `npm run build` ancora senza errori

**Dipendenze:** F0-01

---

### F0-03 — Installare dipendenze dev (Tailwind 4, Vitest, Testing Library)
**Stato:** TODO

**Descrizione:**
Aggiungere Tailwind CSS 4 con plugin Vite (NON postcss) e tooling di test.

**Comandi:**
```bash
cd /c/Users/sergio.pugliese/Desktop/Repo/hackaton2026/frontend
npm install -D tailwindcss@^4.0.0 @tailwindcss/vite@^4.0.0
npm install -D vitest@^2.0.0 @vitest/coverage-v8 @testing-library/react@^16.0.0 @testing-library/jest-dom@^6.0.0 @testing-library/user-event@^14.0.0 jsdom
```

**⚠️ NOTA IMPORTANTE — Tailwind CSS 4:**
- **NON creare** `tailwind.config.js`
- **NON creare** `postcss.config.js`
- La configurazione avviene tramite `@import "tailwindcss"` nel CSS e `@tailwindcss/vite` in `vite.config.ts`

**Definition of Done:**
- Dipendenze installate
- Nessun `tailwind.config.js` o `postcss.config.js` creato
- `npm run build` senza errori

**Dipendenze:** F0-01

---

### F0-04 — Configurare vite.config.ts
**Stato:** TODO

**Descrizione:**
Modificare `vite.config.ts` per aggiungere il plugin Tailwind CSS 4 e configurare il server per la rete locale.

**File:** `frontend/vite.config.ts`

**Struttura attesa:**
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,   // accetta connessioni LAN (utile per demo)
    port: 5173,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

**Definition of Done:**
- `vite.config.ts` contiene entrambi i plugin: `react()` e `tailwindcss()`
- Il server accetta connessioni esterne (`host: true`)
- L'alias `@/` è configurato
- `npm run dev` avvia senza warning

**Dipendenze:** F0-03

---

### F0-05 — Configurare TypeScript strict
**Stato:** TODO

**Descrizione:**
Aggiornare `tsconfig.app.json` con `strict: true`, `noUnusedLocals`, `noUnusedParameters`, e path alias coerenti con `vite.config.ts`.

**File:** `frontend/tsconfig.app.json`

**Struttura attesa (sezione compilerOptions):**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Definition of Done:**
- `npm run build` con strict mode non produce errori
- L'alias `@/` è riconosciuto da TypeScript
- Import tipo `import type { WalletInfo } from '@/types/api'` funziona

**Dipendenze:** F0-04

---

### F0-06 — Creare CSS entry point con design tokens
**Stato:** TODO

**Descrizione:**
Sostituire il CSS default di Vite con il design system MintPass: importazione Tailwind 4, CSS custom properties, stili base, classi glassmorphism.

**File da creare:** `frontend/src/index.css`
**File da eliminare:** `frontend/src/App.css`

**Struttura completa `index.css`:**
```css
@import "tailwindcss";

/* === MintPass Design Tokens === */
:root {
  --bg-base: #050508;
  --bg-card: rgba(255, 255, 255, 0.05);
  --accent-primary: #8b5cf6;   /* violet-500 */
  --accent-secondary: #d946ef; /* fuchsia-500 */
  --success: #10b981;          /* emerald-500 */
  --error: #f43f5e;            /* rose-500 */
  --text-primary: #f8fafc;     /* slate-50 */
  --text-muted: #94a3b8;       /* slate-400 */
}

/* === Base === */
body {
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* === Glassmorphism === */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
}

/* === Glow effects === */
.glow-success {
  box-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
}
.glow-pending {
  box-shadow: 0 0 40px rgba(139, 92, 246, 0.4);
}
.glow-error {
  box-shadow: 0 0 40px rgba(244, 63, 94, 0.4);
}
```

**Definition of Done:**
- `@import "tailwindcss"` funziona senza errori in console
- Classi Tailwind (`bg-white/5`, `backdrop-blur-xl`, ecc.) si applicano
- Lo sfondo della pagina è `#050508`
- `App.css` eliminato

**Dipendenze:** F0-04

---

### F0-07 — Creare .env.example e verificare .gitignore
**Stato:** TODO

**Descrizione:**
Creare il file `.env.example` con le variabili d'ambiente e verificare che `.gitignore` escluda i file `.env.local`.

**File da creare:** `frontend/.env.example`
```
# URL del backend FastAPI
VITE_API_URL=http://<IP_BACKEND>:8000

# Chain ID della blockchain privata (default: 1337 per Geth dev)
VITE_CHAIN_ID=1337

# URL del nodo RPC Ethereum
VITE_RPC_URL=http://<IP_NODO1>:8545
```

**File da verificare:** `frontend/.gitignore`
Deve contenere (già presente nel template Vite):
```
.env.local
.env
*.local
```

**Definition of Done:**
- `.env.example` esiste con le 3 variabili documentate
- `.gitignore` contiene `.env.local`
- `.env.local` **non** è committato nel repo

**Dipendenze:** F0-01

---

### F0-08 — Creare struttura directory
**Stato:** TODO

**Descrizione:**
Creare tutte le cartelle previste dall'architettura con file placeholder.

**Cartelle e file da creare:**
```
frontend/src/pages/.gitkeep
frontend/src/components/.gitkeep
frontend/src/context/.gitkeep
frontend/src/hooks/.gitkeep
frontend/src/api/.gitkeep
frontend/src/utils/.gitkeep
frontend/src/types/.gitkeep
frontend/src/test/.gitkeep
```

**Comandi:**
```bash
cd /c/Users/sergio.pugliese/Desktop/Repo/hackaton2026/frontend/src
mkdir -p pages components context hooks api utils types test
```

**Definition of Done:**
- Tutte le cartelle esistono
- `ls src/` mostra: `pages/`, `components/`, `context/`, `hooks/`, `api/`, `utils/`, `types/`, `test/`

**Dipendenze:** F0-01

---

### F0-09 — Creare tipi TypeScript condivisi
**Stato:** TODO

**Descrizione:**
Definire tutte le interfacce TypeScript basate sulla sezione 9 di `FRONTEND_OVERVIEW.md`. Alcuni tipi sono completi, altri sono stub per le fasi successive.

**File:** `frontend/src/types/api.ts`

**Interfacce complete (Fase 0):**
```ts
export interface WalletInfo {
  name: string
  address: string
  balance_wei: string
  balance_eth: number
  nonce: number
  tokens: TokenBalance[]
}

export interface TokenBalance {
  contract_address: string
  name: string
  symbol: string
  balance: number
  token_ids: number[]
}

export interface HealthResponse {
  status: 'ok' | 'rpc_unreachable'
  block_number: number | null
  rpc_url: string
  chain_id: number
}
```

**Interfacce stub (fasi successive):**
```ts
export interface ListingInfo {
  token_id: number
  seller: string
  price_wei: string
}

export interface TicketInfo {
  token_id: number
  owner: string
}

// TxResult.status: "success" | "failed" | "pending" | "submitted"
export interface TxResult {
  tx_hash: string | null
  status: 'success' | 'failed' | 'pending' | 'submitted'
  block_number: number | null
  gas_used: number | null
  from_address: string | null
  to_address: string | null
  value_wei: string | null
  error: string | null
}

export interface EventListed {
  seller: string
  token_id: number
  price_wei: string
  block_number: number
  transaction_hash: string
}

export interface EventSold {
  seller: string
  buyer: string
  token_id: number
  price_wei: string
  block_number: number
  transaction_hash: string
}
```

**Definition of Done:**
- File compila senza errori con `strict: true`
- Import `import type { WalletInfo } from '@/types/api'` funziona

**Dipendenze:** F0-05, F0-08

---

### F0-10 — Creare axiosInstance.ts
**Stato:** TODO

**Descrizione:**
Creare l'istanza Axios centralizzata con `baseURL` da env, timeout, e interceptor per error handling.

**File:** `frontend/src/api/axiosInstance.ts`

**Struttura attesa:**
```ts
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  console.warn('[axiosInstance] VITE_API_URL non è definita. Le chiamate API falliranno.')
}

export const axiosInstance = axios.create({
  baseURL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor: pass-through data, log errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.config?.url, error.message)
    return Promise.reject(error)
  }
)
```

**Definition of Done:**
- Import `import { axiosInstance } from '@/api/axiosInstance'` funziona
- Warning in console se `VITE_API_URL` non è definita
- Timeout configurato a 10 secondi

**Dipendenze:** F0-02, F0-08

---

### F0-11 — Creare AuthContext
**Stato:** TODO

**Descrizione:**
Creare il context per l'identità utente con persistenza in `sessionStorage`.

**File:** `frontend/src/context/AuthContext.tsx`

**Struttura attesa:**
```ts
interface AuthContextValue {
  currentUser: WalletInfo | null
  setCurrentUser: (user: WalletInfo) => void
  logout: () => void
}

// AuthContext = createContext<AuthContextValue | undefined>(undefined)

// AuthProvider:
//   - init: legge da sessionStorage (JSON.parse, con try/catch)
//   - setCurrentUser: salva in state + sessionStorage.setItem
//   - logout: setta null + sessionStorage.removeItem
//   - espone il value tramite AuthContext.Provider

// useAuth():
//   - consuma AuthContext
//   - se undefined (fuori dal provider): throw new Error("useAuth deve essere usato dentro AuthProvider")
//   - return: AuthContextValue
```

**Definition of Done:**
- `AuthProvider` e `useAuth` sono esportati correttamente
- `useAuth()` fuori dal provider lancia un errore chiaro
- `currentUser` è `null` di default se sessionStorage è vuoto
- Compila con `strict: true`

**Dipendenze:** F0-09

---

### F0-12 — Creare pagine placeholder
**Stato:** TODO

**Descrizione:**
Creare le 4 pagine come componenti minimali con stile glassmorphism. `SelectIdentityPage` avrà il contenuto reale al task F0-14.

**File da creare:**

`frontend/src/pages/DashboardPage.tsx`
```tsx
export function DashboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--bg-base)' }}>
      <div className="glass-card p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Marketplace + Wallet — in costruzione</p>
      </div>
    </div>
  )
}
```

`frontend/src/pages/TokenHistoryPage.tsx`
```tsx
import { useParams } from 'react-router-dom'
export function TokenHistoryPage() {
  const { tokenId } = useParams()
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--bg-base)' }}>
      <div className="glass-card p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Token #{tokenId}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Storia on-chain — in costruzione</p>
      </div>
    </div>
  )
}
```

`frontend/src/pages/NotFoundPage.tsx`
```tsx
import { Link } from 'react-router-dom'
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--bg-base)' }}>
      <div className="glass-card p-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <p style={{ color: 'var(--text-muted)' }} className="mb-4">Pagina non trovata</p>
        <Link to="/" className="text-violet-400 hover:text-violet-300 underline">Torna all'inizio</Link>
      </div>
    </div>
  )
}
```

`frontend/src/pages/SelectIdentityPage.tsx` — placeholder temporaneo (verrà sostituito da F0-14):
```tsx
export function SelectIdentityPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--bg-base)' }}>
      <div className="glass-card p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">MintPass</h1>
        <p style={{ color: 'var(--text-muted)' }}>Connessione in corso...</p>
      </div>
    </div>
  )
}
```

**Definition of Done:**
- Tutti e 4 i file compilano senza errori
- Ogni pagina mostra contenuto visibile con sfondo dark e glassmorphism

**Dipendenze:** F0-06, F0-08

---

### F0-13 — Configurare React Router 7 e App.tsx
**Stato:** TODO

**Descrizione:**
Riscrivere `App.tsx` e `main.tsx` per usare React Router 7 con `createBrowserRouter` e wrappare con `AuthProvider`.

**File:** `frontend/src/App.tsx`
```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { SelectIdentityPage } from '@/pages/SelectIdentityPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TokenHistoryPage } from '@/pages/TokenHistoryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const router = createBrowserRouter([
  { path: '/', element: <SelectIdentityPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/token/:tokenId', element: <TokenHistoryPage /> },
  { path: '*', element: <NotFoundPage /> },
])

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
```

**File:** `frontend/src/main.tsx`
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**Definition of Done:**
- `/` → SelectIdentityPage
- `/dashboard` → DashboardPage
- `/token/42` → TokenHistoryPage con `tokenId = "42"`
- `/xyz` → NotFoundPage
- Nessun errore in console

**Dipendenze:** F0-11, F0-12

---

### F0-14 — Implementare health check in SelectIdentityPage
**Stato:** TODO

**Descrizione:**
Aggiornare `SelectIdentityPage` con la chiamata reale a `GET /api/health` e mostrare il risultato.

**File:** `frontend/src/pages/SelectIdentityPage.tsx`

**Logica:**
```
useState: health (HealthResponse | null), loading (boolean), error (string | null)

useEffect (mount):
  - setLoading(true)
  - axiosInstance.get<HealthResponse>('/api/health')
  - success → setHealth(data)
  - catch → setError(messaggio user-friendly)
  - finally → setLoading(false)

Render:
  - Loading:
      Spinner animato + "Connessione alla blockchain..."

  - Error:
      Pallino rosso + "Backend non raggiungibile"
      Messaggio: "Assicurati che il backend sia in esecuzione su " + VITE_API_URL

  - health.status === 'rpc_unreachable':
      Pallino rosso + "RPC non raggiungibile"
      Dettaglio: rpc_url mostrato

  - health.status === 'ok':
      Pallino verde animato (pulse) + "Blockchain connessa"
      Block number: <numero>
      Chain ID: <id>
      RPC: <url troncato>

      (placeholder per la lista utenti che arriverà in Fase 1)
      Testo: "Scegli la tua identità blockchain →"
```

**Design:**
- Tutto centrato verticalmente in `min-h-screen`
- Usa `.glass-card`, `var(--text-muted)`, `var(--success)`, `var(--error)`
- Font monospace per indirizzi e hash (`font-mono`)

**Definition of Done:**
- Con backend attivo → mostra "Blockchain connessa" con dati
- Con backend spento → mostra errore graceful, nessun crash
- Loading state visibile

**Dipendenze:** F0-10, F0-13

---

### F0-15 — Creare utility format.ts e colors.ts
**Stato:** TODO

**Descrizione:**
Implementare le funzioni di utilità per formattazione e colori.

**File:** `frontend/src/utils/format.ts`

Funzioni da implementare:
```ts
// Tronca un indirizzo Ethereum: "0x1234...abcd"
export function shortAddress(address: string): string
// Input: "0x1234567890abcdef1234567890abcdef12345678"
// Output: "0x1234...5678"
// Edge case: stringa vuota o < 10 char → return as-is

// Formatta wei in ETH leggibile: "12.50 ETH"
export function formatEth(weiValue: string): string
// Usa ethers.formatEther
// Input: "12500000000000000000"
// Output: "12.5 ETH"

// Formatta unix timestamp in data locale
export function formatDate(blockNumber: number): string
// Nota: in assenza di un timestamp reale, mostra "Block #<n>"
// Può essere esteso in fasi successive
```

**File:** `frontend/src/utils/colors.ts`

Funzioni da implementare:
```ts
// Genera un linear-gradient deterministico da un indirizzo Ethereum
export function addressToGradient(address: string): string
// Algoritmo:
//   h1 = parseInt(address.slice(2, 6), 16) % 360
//   h2 = (h1 + 60) % 360
//   return `linear-gradient(135deg, hsl(${h1}, 70%, 50%), hsl(${h2}, 70%, 50%))`
// Proprietà: stesso address = stesso output (deterministico)
```

**Definition of Done:**
- `shortAddress("0x1234567890abcdef1234567890abcdef12345678")` → `"0x1234...5678"`
- `formatEth("1000000000000000000")` → `"1.0 ETH"`
- `addressToGradient("0xabc...")` restituisce una stringa che inizia con `"linear-gradient"`
- Stesso indirizzo sempre produce stesso gradient

**Dipendenze:** F0-02, F0-08

---

### F0-16 — Configurare Vitest
**Stato:** TODO

**Descrizione:**
Configurare Vitest per i test con jsdom e Testing Library. Aggiungere gli script npm.

**File da creare:** `frontend/src/test/setup.ts`
```ts
import '@testing-library/jest-dom'
```

**File da modificare:** `frontend/vite.config.ts` (aggiungere sezione `test`)
```ts
// Aggiungere a defineConfig:
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  alias: {
    '@': resolve(__dirname, './src'),
  },
}
```

**Script in `package.json`:**
```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

**Definition of Done:**
- `npm test` avvia Vitest in watch mode
- `npm run test:run` esegue tutti i test una volta
- Un test minimale (`expect(1 + 1).toBe(2)`) passa
- Environment jsdom è attivo

**Dipendenze:** F0-03, F0-04

---

### F0-17 — Test unitari per utility
**Stato:** TODO

**Descrizione:**
Scrivere i test per `format.ts` e `colors.ts`.

**File:** `frontend/src/utils/format.test.ts`
```ts
// Test cases:
// shortAddress: indirizzo completo → troncato correttamente
// shortAddress: stringa vuota → non crasha
// shortAddress: stringa corta → return as-is
// formatEth: "1000000000000000000" → "1.0 ETH"
// formatEth: "0" → "0.0 ETH"
// formatEth: "500000000000000000" → "0.5 ETH"
```

**File:** `frontend/src/utils/colors.test.ts`
```ts
// Test cases:
// addressToGradient: output inizia con "linear-gradient"
// addressToGradient: stesso indirizzo = stesso output (deterministico)
// addressToGradient: indirizzi diversi = output diversi (in genere)
```

**Definition of Done:**
- `npm run test:run` esegue tutti i test e passano
- Nessun test skippato o in errore

**Dipendenze:** F0-15, F0-16

---

### F0-18 — Pulizia file default Vite
**Stato:** TODO

**Descrizione:**
Rimuovere tutti i file generati da Vite che non servono al progetto.

**File da eliminare:**
- `frontend/src/App.css`
- `frontend/src/assets/react.svg`
- `frontend/public/vite.svg`

**File da modificare:**

`frontend/index.html`:
- Cambiare `<title>` in `"MintPass"`
- Aggiungere `<link>` per JetBrains Mono da Google Fonts
- Aggiornare `href` favicon a `favicon.svg`

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<title>MintPass</title>
```

**Definition of Done:**
- Nessuno dei file eliminati esiste più
- Tab del browser mostra "MintPass"
- JetBrains Mono caricato (visibile in DevTools → Network → font)
- `npm run build` senza errori

**Dipendenze:** F0-01

---

### F0-19 — Aggiungere favicon SVG
**Stato:** TODO

**Descrizione:**
Creare un favicon SVG minimalista per MintPass.

**File:** `frontend/public/favicon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <!-- Lettera "M" stilizzata in violet su sfondo scuro -->
  <rect width="32" height="32" rx="8" fill="#050508"/>
  <text x="16" y="22" font-family="system-ui" font-size="18" font-weight="700"
        fill="#8b5cf6" text-anchor="middle">M</text>
</svg>
```

**Definition of Done:**
- `public/favicon.svg` esiste
- Il favicon appare nella tab del browser
- `index.html` referenzia `/favicon.svg`

**Dipendenze:** F0-18

---

### F0-20 — Smoke test manuale e verifica finale
**Stato:** TODO

**Descrizione:**
Verifica end-to-end che tutto funziona insieme.

**Procedura:**
```bash
# 1. Preparare l'ambiente
cd /c/Users/sergio.pugliese/Desktop/Repo/hackaton2026/frontend
cp .env.example .env.local
# Modificare .env.local con i valori reali (o lasciare come è per test locale)

# 2. Dev server
npm run dev
# → Aprire http://localhost:5173
# → Verificare visivamente (checklist sotto)

# 3. Build
npm run build
# → Deve completare senza errori TypeScript

# 4. Test
npm run test:run
# → Tutti i test devono passare
```

**Checklist visiva (aprire http://localhost:5173):**
- [ ] Sfondo è `#050508` (quasi nero)
- [ ] Nessun contenuto default di Vite (nessun logo di React, nessun counter)
- [ ] Tab del browser mostra "MintPass"
- [ ] Favicon "M" violet visibile nella tab
- [ ] La pagina mostra un GlassCard con bordo semitrasparente e blur
- [ ] Il font del titolo è bold, il font monospace è JetBrains Mono
- [ ] Viene chiamato `GET /api/health` (visibile in Network tab)
- [ ] Navigazione a `/dashboard` mostra la pagina placeholder
- [ ] Navigazione a `/token/42` mostra "Token #42"
- [ ] Navigazione a `/nope` mostra la pagina 404 con link home

**Definition of Done:**
Tutti i 10 check visivi superati + `npm run build` e `npm run test:run` passano.

**Dipendenze:** tutti i task F0-01 → F0-19

---

## Ordine di Esecuzione Consigliato

```
F0-01 → F0-18 → F0-19
F0-01 → F0-07
F0-01 → F0-02 → F0-10
F0-01 → F0-03 → F0-04 → F0-06
              → F0-16
F0-04 → F0-05 → F0-09 → F0-11
F0-08 (dopo F0-01)
F0-09, F0-10, F0-11, F0-15 → F0-12 → F0-13 → F0-14
F0-15, F0-16 → F0-17
F0-14 + tutti → F0-20
```

**Sequenza lineare pratica:**
1. F0-01 (scaffold)
2. F0-18 (pulizia)
3. F0-02, F0-03 (dipendenze — in parallelo)
4. F0-04 (vite config)
5. F0-05 (tsconfig)
6. F0-06 (css design tokens)
7. F0-07 (.env)
8. F0-08 (struttura directory)
9. F0-09 (tipi TS)
10. F0-10 (axios)
11. F0-11 (AuthContext)
12. F0-12 (pagine placeholder)
13. F0-13 (router + App.tsx)
14. F0-14 (health check)
15. F0-15 (utils)
16. F0-16 (vitest config)
17. F0-17 (test utility)
18. F0-19 (favicon)
19. F0-20 (smoke test finale)

---

## Criteri di Completamento della Fase 0

La Fase 0 è **completa** quando:

- [ ] `npm install` completa senza errori
- [ ] `npm run dev` avvia su `http://localhost:5173`
- [ ] Sfondo pagina è `#050508`
- [ ] Classi Tailwind CSS 4 funzionano (`bg-white/5`, `backdrop-blur-xl`)
- [ ] Classe `.glass-card` applica blur + bordo semitrasparente
- [ ] JetBrains Mono caricato per elementi `font-mono`
- [ ] `/` chiama `GET /api/health` e gestisce sia successo che errore
- [ ] `/dashboard` mostra placeholder
- [ ] `/token/42` mostra placeholder con tokenId
- [ ] `/nope` mostra pagina 404 con link home
- [ ] `AuthContext` attivo (`useAuth()` non lancia errore dentro l'app)
- [ ] `axiosInstance` usa `VITE_API_URL` come baseURL
- [ ] `.env.example` presente con le 3 variabili
- [ ] `npm run build` senza errori TypeScript
- [ ] `npm run test:run` — tutti i test passano
- [ ] **NON** esistono: `tailwind.config.js`, `postcss.config.js`, `App.css`
- [ ] **NON** esistono file default Vite (react.svg, vite.svg, demo content)
- [ ] `<title>MintPass</title>` in index.html
- [ ] Favicon "M" violet visibile nella tab

---

## Rischi

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Conflitto `npm create vite` con file esistenti | Media | Basso | Vite chiede conferma; FRONTEND_OVERVIEW.md e PHASE_0_TASKS.md non vengono toccati |
| Tailwind v4 breaking changes rispetto a v3 | Alta | Medio | **NON** usare `tailwind.config.js`. Usare solo `@import "tailwindcss"` + `@tailwindcss/vite` |
| Path alias `@/` non funziona con Vitest | Media | Basso | Configurare `test.alias` in `vitest.config.ts` o usare `vite-tsconfig-paths` |
| Backend non disponibile durante sviluppo | Alta | Basso | Health check gestisce errore gracefully. Sviluppo frontend è indipendente dal backend |
