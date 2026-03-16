# Fase 1: SelectIdentityPage — Task Documentation

> MintPass Frontend | Hackathon 2026
> Branch: `test-frontend`
> Prerequisito: Fase 0 completata
> Stato: DONE

---

## 1. User Stories

### US-F1-01: Visualizzare la lista degli utenti blockchain
**Come** presentatore alla demo, **voglio** vedere tutti gli utenti registrati sulla blockchain quando apro l'app, **così che** posso dimostrare che il sistema conosce i partecipanti.

**Acceptance Criteria:**
- [ ] La pagina `/` chiama `GET /api/wallets` al mount
- [ ] Per ogni utente viene mostrata una card con: nome, indirizzo troncato (`0x1234...5678`), ETH balance, numero di ticket posseduti
- [ ] Ogni card ha un avatar con gradient deterministico generato dall'indirizzo
- [ ] Se `tokens` è un array vuoto o `token_ids` è null, viene mostrato "0 ticket"
- [ ] Le card sono in un grid responsive: 1 colonna su mobile, 2 su `sm:`, centrato con `max-w-2xl`

---

### US-F1-02: Selezionare un'identità blockchain
**Come** utente della demo, **voglio** cliccare su una card utente per assumere quella identità, **così che** posso navigare alla dashboard senza bisogno di login tradizionale.

**Acceptance Criteria:**
- [ ] Click su una card chiama `setCurrentUser(walletInfo)` da AuthContext
- [ ] Dopo `setCurrentUser`, l'app naviga automaticamente a `/dashboard`
- [ ] La navigazione non avviene se `setCurrentUser` non è stato chiamato
- [ ] Il messaggio "Non è un login tradizionale — la tua identità è la tua chiave blockchain" è visibile sopra le card

---

### US-F1-03: Vedere lo stato della blockchain prima della lista utenti
**Come** presentatore, **voglio** che il health check resti visibile in cima alla pagina, **così che** i giudici vedono lo stato della connessione blockchain prima di scegliere un utente.

**Acceptance Criteria:**
- [ ] Il health check card rimane in cima, come nella Fase 0
- [ ] La lista utenti appare sotto il health check solo se `health.status === 'ok'`
- [ ] Se il backend non è raggiungibile, la lista utenti NON viene mostrata

---

### US-F1-04: Vedere uno stato di caricamento durante il fetch
**Come** utente, **voglio** vedere degli skeleton placeholder mentre la lista utenti si carica, **così che** so che l'app sta lavorando.

**Acceptance Criteria:**
- [ ] Durante il loading di `useUsers`, vengono mostrati 3 skeleton card
- [ ] Le skeleton card hanno la stessa dimensione e layout delle card reali
- [ ] L'animazione è `animate-pulse` su sfondo `bg-white/10`

---

### US-F1-05: Gestire errori nel caricamento utenti
**Come** utente, **voglio** vedere un messaggio chiaro se il caricamento degli utenti fallisce, **così che** so cosa sta succedendo.

**Acceptance Criteria:**
- [ ] Se `GET /api/wallets` fallisce, viene mostrato un messaggio di errore con pallino rosso
- [ ] Il messaggio suggerisce di verificare il backend
- [ ] Il health check rimane visibile (il suo errore è indipendente)

---

### US-F1-06: Proteggere la route /dashboard
**Come** sviluppatore, **voglio** che la route `/dashboard` sia protetta da un `PrivateRoute`, **così che** gli utenti senza identità selezionata vengano reindirizzati a `/`.

**Acceptance Criteria:**
- [ ] Se `currentUser === null` e l'utente naviga a `/dashboard`, viene reindirizzato a `/`
- [ ] Se `currentUser !== null`, la dashboard viene renderizzata normalmente
- [ ] Anche `/token/:tokenId` è protetta da `PrivateRoute`

---

## 2. Task List Dettagliata

### F1-01 — Creare il componente Skeleton
**Stato:** DONE

**Descrizione:**
Componente generico per loading states. Renderizza un rettangolo animato con dimensioni configurabili tramite `className`.

**File da creare:** `frontend/src/components/Skeleton.tsx`

**Interface props:**
```ts
interface SkeletonProps {
  readonly className?: string  // Tailwind classes per width, height, border-radius
}
```

**Struttura JSX:**
```
<div className={`animate-pulse bg-white/10 rounded-2xl ${className ?? ''}`} />
```

**Logica:** Nessuna logica interna. Componente presentazionale puro. Il chiamante controlla forma e dimensioni tramite `className`.

**Tailwind classes principali:**
- `animate-pulse` — animazione pulsante
- `bg-white/10` — sfondo semitrasparente per dark theme
- `rounded-2xl` — bordi arrotondati default

**Definition of Done:**
- [x] Renderizza un div con animazione pulse
- [x] `className` viene applicato correttamente
- [x] Nessuno stato interno, nessun side effect

**Dipendenze:** Nessuna

---

### F1-02 — Creare lo hook useUsers
**Stato:** DONE

**Descrizione:**
Custom hook che chiama `GET /api/wallets` e restituisce la lista di `WalletInfo[]` con gestione di loading, error e refetch.

**File da creare:** `frontend/src/hooks/useUsers.ts`

**Signature:**
```ts
interface UseUsersReturn {
  readonly users: readonly WalletInfo[]
  readonly loading: boolean
  readonly error: string | null
  readonly refetch: () => void
}

export function useUsers(): UseUsersReturn
```

**Logica dettagliata:**
1. `useState` per `users` (`WalletInfo[]`, init `[]`), `loading` (boolean, init `true`), `error` (`string | null`, init `null`)
2. Funzione interna `fetchUsers` (wrappata in `useCallback`):
   - Setta `loading = true`, `error = null`
   - `axiosInstance.get<WalletInfo[]>('/api/wallets')`
   - Success → `users = response.data`
   - Catch → `error` con messaggio specifico in base al codice HTTP (vedi sezione 4)
   - Finally → `loading = false`
3. `useEffect(() => { fetchUsers() }, [fetchUsers])` al mount
4. `refetch` espone `fetchUsers`

**Gestione errori per codice HTTP:**
- `404` → "Nessun wallet configurato sul backend."
- `5xx` → "Errore del server. Riprova tra qualche secondo."
- Network error (no response) → "Impossibile caricare gli utenti. Verifica che il backend sia attivo."
- Altro → "Errore imprevisto nel caricamento degli utenti."

**Definition of Done:**
- [x] Chiama `GET /api/wallets` al mount
- [x] Restituisce `users`, `loading`, `error`, `refetch`
- [x] `loading` è `true` durante il fetch, `false` dopo
- [x] `error` contiene un messaggio leggibile in caso di fallimento
- [x] `refetch()` ri-esegue la chiamata

**Dipendenze:** Nessuna (usa `axiosInstance` e `WalletInfo` già esistenti)

---

### F1-03 — Creare il componente UserCard
**Stato:** DONE

**Descrizione:**
Card cliccabile che mostra i dati di un utente blockchain: avatar con gradient, nome, indirizzo troncato, ETH balance, numero di ticket.

**File da creare:** `frontend/src/components/UserCard.tsx`

**Interface props:**
```ts
interface UserCardProps {
  readonly user: WalletInfo
  readonly onClick: () => void
}
```

**Struttura JSX (a grandi linee):**
```
<button onClick={onClick} className="glass-card p-4 w-full text-left hover:... transition-... cursor-pointer">
  <div className="flex items-center gap-4">

    {/* Avatar — gradient + iniziale */}
    <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center
                    text-white font-bold text-lg select-none"
         style={{ background: addressToGradient(user.address) }}>
      {iniziale}
    </div>

    {/* Nome + indirizzo */}
    <div className="flex-1 min-w-0">
      <p className="text-white font-medium truncate">{user.name}</p>
      <p className="text-slate-400 text-sm font-mono">{shortAddress(user.address)}</p>
    </div>

    {/* Stats: ETH + ticket */}
    <div className="text-right flex-shrink-0">
      <p className="text-white font-mono font-semibold text-sm">{formatEth(user.balance_wei)}</p>
      <p className="text-slate-400 text-xs">{ticketCount} ticket</p>
    </div>

  </div>
</button>
```

**Logica dettagliata:**
- **Iniziale avatar:** `user.name.charAt(0).toUpperCase()`. Se `name` è stringa vuota, usare `user.address.charAt(2).toUpperCase()` (primo char dopo "0x").
- **Ticket count:** `user.tokens.reduce((sum, t) => sum + t.balance, 0)`. Se `tokens` è `[]`, il risultato è `0`.
- Usa `<button>` (non `<div>`) per accessibilità e keyboard navigation.

**Tailwind classes principali:**
- Root: `glass-card p-4 w-full text-left hover:bg-white/10 hover:border-white/20 transition-colors cursor-pointer`
- Avatar: `w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg select-none`
- Nome: `text-white font-medium truncate`
- Indirizzo: `text-slate-400 text-sm font-mono`
- ETH: `text-white font-mono font-semibold text-sm`
- Ticket: `text-slate-400 text-xs`

**Definition of Done:**
- [x] Mostra nome, indirizzo troncato, ETH balance, ticket count
- [x] Avatar con gradient deterministico dall'indirizzo
- [x] Click chiama `onClick`
- [x] Hover con transizione visual
- [x] `tokens` vuoto → "0 ticket"
- [x] Layout non si rompe con nomi lunghi (`truncate`)

**Dipendenze:** Usa `shortAddress`, `formatEth`, `addressToGradient` già esistenti

---

### F1-04 — Creare il componente PrivateRoute
**Stato:** DONE

**Descrizione:**
Wrapper che protegge le route autenticate. Se `currentUser` è `null`, reindirizza a `/`.

**File da creare:** `frontend/src/components/PrivateRoute.tsx`

**Interface props:**
```ts
interface PrivateRouteProps {
  readonly children: ReactNode
}
```

**Struttura:**
```ts
function PrivateRoute({ children }: PrivateRouteProps) {
  const { currentUser } = useAuth()

  if (currentUser === null) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
```

**Logica:**
- Usa `useAuth()` per leggere `currentUser`
- Se `null` → `<Navigate to="/" replace />` (redirect istantaneo, non aggiunge alla history)
- Se non `null` → renderizza `children`
- Usa `<Navigate>` componente (non `useNavigate` hook) per semplicità

**Definition of Done:**
- [x] Redirect a `/` se `currentUser === null`
- [x] Renderizza children se `currentUser !== null`
- [x] Usa `<Navigate replace>` per non inquinare la history

**Dipendenze:** Nessuna (usa `AuthContext` già esistente)

---

### F1-05 — Aggiornare App.tsx con PrivateRoute
**Stato:** DONE

**Descrizione:**
Wrappare le route `/dashboard` e `/token/:tokenId` con `PrivateRoute` per proteggere l'accesso.

**File da modificare:** `frontend/src/App.tsx`

**Modifiche:**
```ts
// Aggiungere import
import { PrivateRoute } from '@/components/PrivateRoute'

// Route aggiornate
{ path: '/dashboard', element: <PrivateRoute><DashboardPage /></PrivateRoute> },
{ path: '/token/:tokenId', element: <PrivateRoute><TokenHistoryPage /></PrivateRoute> },
```

**Nota:** `AuthProvider` wrappa `RouterProvider`, quindi `useAuth()` dentro `PrivateRoute` funziona correttamente.

**Definition of Done:**
- [x] `/dashboard` senza `currentUser` redirige a `/`
- [x] `/token/42` senza `currentUser` redirige a `/`
- [x] Con `currentUser` settato, `/dashboard` mostra il placeholder
- [x] `npm run build` senza errori

**Dipendenze:** F1-04

---

### F1-06 — Aggiornare SelectIdentityPage con lista utenti
**Stato:** DONE

**Descrizione:**
Estendere la pagina esistente per mostrare la lista utenti sotto il health check. Integrare `useUsers`, `UserCard`, `Skeleton`, navigazione e messaggio di identità.

**File da modificare:** `frontend/src/pages/SelectIdentityPage.tsx`

**Logica dettagliata:**

**1. Import aggiuntivi:**
```ts
import { useUsers } from '@/hooks/useUsers'
import { UserCard } from '@/components/UserCard'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { WalletInfo } from '@/types/api'
```

**2. Hook setup (dentro il componente):**
```ts
const { users, loading: usersLoading, error: usersError } = useUsers()
const { setCurrentUser } = useAuth()
const navigate = useNavigate()
```

**3. Handler selezione:**
```ts
function handleSelectUser(user: WalletInfo): void {
  setCurrentUser(user)
  navigate('/dashboard')
}
```

**4. Layout aggiornato (struttura generale):**
```
<div className="min-h-screen flex flex-col items-center p-4 pt-12 bg-[#050508]">

  {/* Titolo */}
  <div className="mb-8 text-center">
    <h1>MintPass</h1>
    <p className="text-slate-400">La tua identità è la tua chiave blockchain</p>
  </div>

  {/* Health check card (logica invariata, dentro container max-w-2xl) */}
  <div className="w-full max-w-2xl mb-6">
    <div className="glass-card p-6">
      {/* ...health check JSX esistente... */}
    </div>
  </div>

  {/* Sezione utenti — visibile SOLO se health.status === 'ok' */}
  {health?.status === 'ok' && (
    <div className="w-full max-w-2xl">

      {/* Messaggio identità */}
      <p className="text-slate-500 text-sm text-center mb-6">
        Non è un login tradizionale — la tua identità è la tua chiave blockchain.
        Scegli un utente per iniziare.
      </p>

      {/* Loading: 3 skeleton cards */}
      {usersLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {/* Error */}
      {usersError && (
        <div className="flex items-start gap-3 glass-card p-4">
          <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0 bg-rose-500" />
          <p className="text-white text-sm">{usersError}</p>
        </div>
      )}

      {/* Empty state */}
      {!usersLoading && !usersError && users.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-8">
          Nessun utente trovato sulla blockchain.
        </p>
      )}

      {/* Grid utenti */}
      {!usersLoading && !usersError && users.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {users.map((user) => (
            <UserCard
              key={user.address}
              user={user}
              onClick={() => handleSelectUser(user)}
            />
          ))}
        </div>
      )}

    </div>
  )}

</div>
```

**Cosa cambia rispetto alla Fase 0:**
- Layout: da `justify-center` a `pt-12 flex-col items-center` (la pagina non è più centrata verticalmente)
- Health check card è ora dentro un wrapper `max-w-2xl`
- La sezione utenti appare condizionalmente sotto il health check
- L'iniziale loading dell'health check usa già il suo spinner — la sezione utenti usa `Skeleton`

**Definition of Done:**
- [x] Health check funziona come prima
- [x] Lista utenti caricata e mostrata sotto il health check
- [x] Skeleton durante il loading utenti
- [x] Errore gestito con messaggio user-friendly
- [x] Click su card → `setCurrentUser` + naviga a `/dashboard`
- [x] Grid responsive 1 col mobile, 2 col `sm:`
- [x] Messaggio "Non è un login tradizionale..." visibile
- [x] `users.length === 0` → messaggio empty state

**Dipendenze:** F1-01, F1-02, F1-03 (e F1-04 già fatto con F1-05)

---

## 3. Componenti — Props e Struttura

### Skeleton
| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `className` | `string?` | `undefined` | Classi Tailwind aggiuntive per dimensioni e forma |

**Comportamento:** Div con `animate-pulse bg-white/10 rounded-2xl`. Nessuno stato interno.

---

### UserCard
| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `user` | `WalletInfo` | required | Dati dell'utente dalla blockchain |
| `onClick` | `() => void` | required | Handler al click sulla card |

**Comportamento:**
- Calcola iniziale da `user.name` (fallback: primo char address dopo "0x")
- Calcola ticket count: `user.tokens.reduce((sum, t) => sum + t.balance, 0)`
- Renderizza `<button>` con avatar gradient + dati utente

**Stati interni:** Nessuno. Componente stateless.

---

### PrivateRoute
| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Contenuto da proteggere |

**Comportamento:**
- `currentUser === null` → `<Navigate to="/" replace />`
- `currentUser !== null` → renderizza `children`

**Stati interni:** Nessuno.

---

## 4. Hook useUsers — Contratto Completo

```ts
// frontend/src/hooks/useUsers.ts

interface UseUsersReturn {
  readonly users: readonly WalletInfo[]
  readonly loading: boolean
  readonly error: string | null
  readonly refetch: () => void
}

export function useUsers(): UseUsersReturn
```

| Campo | Tipo | Valore iniziale | Descrizione |
|-------|------|-----------------|-------------|
| `users` | `readonly WalletInfo[]` | `[]` | Lista utenti. Vuota durante loading o se API ritorna `[]` |
| `loading` | `boolean` | `true` | `true` durante la chiamata API |
| `error` | `string \| null` | `null` | Messaggio leggibile se la chiamata fallisce |
| `refetch` | `() => void` | N/A | Riesegue la chiamata API |

**Ciclo di vita:**
1. Mount → `loading=true`, `error=null`, `users=[]`
2. Fetch success → `loading=false`, `error=null`, `users=[...data]`
3. Fetch error → `loading=false`, `error="messaggio"`, `users=[]`
4. `refetch()` → ripete dal punto 1

**Messaggi di errore per codice HTTP:**
| Caso | Messaggio |
|------|-----------|
| HTTP 404 | "Nessun wallet configurato sul backend." |
| HTTP 5xx | "Errore del server. Riprova tra qualche secondo." |
| Network error (no response) | "Impossibile caricare gli utenti. Verifica che il backend sia attivo." |
| Altro | "Errore imprevisto nel caricamento degli utenti." |

---

## 5. Test da Scrivere

### `src/components/Skeleton.test.tsx`
1. Renderizza un div con classe `animate-pulse`
2. Renderizza un div con classe `bg-white/10`
3. Applica `className` aggiuntivo passato come prop (merge corretto)
4. Non ha testo o contenuto visibile se non passato

### `src/components/UserCard.test.tsx`
1. Mostra il nome dell'utente
2. Mostra l'indirizzo troncato (contiene "...")
3. Mostra il balance ETH formattato (contiene "ETH")
4. Mostra "0 ticket" quando `tokens` è array vuoto
5. Mostra conteggio corretto quando `tokens` ha elementi con `balance > 0`
6. Mostra l'iniziale del nome nell'avatar
7. Chiama `onClick` al click sulla card
8. Il root element è `<button>` o ha `role="button"`
9. Gestisce nome vuoto: fallback all'indirizzo

### `src/components/PrivateRoute.test.tsx`
1. Renderizza children quando `currentUser` non è null
2. Non renderizza children quando `currentUser` è null
3. Redirige a `/` quando `currentUser` è null
4. Usa `replace` nel redirect (verifica `location.key` o comportamento history)

### `src/hooks/useUsers.test.ts`
1. `loading` è `true` inizialmente
2. `loading` diventa `false` dopo fetch success
3. `loading` diventa `false` dopo fetch error
4. `users` contiene i dati dopo fetch success (mock axios)
5. `users` è `[]` dopo fetch error
6. `error` è `null` dopo fetch success
7. `error` contiene un messaggio leggibile dopo fetch error
8. Gestisce risposta vuota `[]` senza errore (non è un errore)
9. `refetch()` riesegue la chiamata API

### `src/pages/SelectIdentityPage.test.tsx`
1. Mostra il titolo "MintPass"
2. Chiama `GET /api/health` al mount
3. Mostra skeleton cards durante il loading degli utenti (con health ok mockato)
4. Mostra le card utente dopo il fetch (con health ok e users mockati)
5. Mostra messaggio errore se il fetch utenti fallisce
6. Click su una card chiama `setCurrentUser` con i dati corretti
7. Click su una card naviga a `/dashboard`
8. NON mostra la sezione utenti se health check è in errore
9. Mostra "Nessun utente trovato" se la lista è vuota

---

## 6. Criteri di Completamento della Fase 1

La Fase 1 è **completa** quando:

- [x] `GET /api/wallets` viene chiamato dalla pagina `/`
- [x] Per ogni utente viene mostrata una card con nome, indirizzo troncato, ETH balance, n. ticket
- [x] Avatar con gradient deterministico dall'indirizzo visibile
- [x] Click su una card salva l'utente in `AuthContext` (verificabile in DevTools → Application → Session Storage)
- [x] Click su una card naviga a `/dashboard`
- [x] `/dashboard` senza identità selezionata redirige a `/`
- [x] `/token/:tokenId` senza identità selezionata redirige a `/`
- [x] Health check resta visibile e funzionante in cima alla pagina
- [x] Skeleton cards mostrate durante il loading
- [x] Errore di rete gestito con messaggio user-friendly, nessun crash
- [x] `tokens` vuoto → "0 ticket", nessun errore
- [x] Grid responsive: 1 colonna mobile, 2 colonne `sm:`
- [x] Messaggio "Non è un login tradizionale..." visibile quando blockchain connessa
- [x] `npm run build` senza errori TypeScript
- [x] `npm run test:run` — tutti i test passano (57/57)
- [x] Nessuna mutazione diretta di stato
- [x] File < 200 righe ciascuno

---

## 7. Ordine di Esecuzione

```
F1-01 (Skeleton)          — nessuna dipendenza
F1-02 (useUsers)          — nessuna dipendenza
F1-03 (UserCard)          — nessuna dipendenza
F1-04 (PrivateRoute)      — nessuna dipendenza
       |
F1-05 (App.tsx)           — richiede F1-04
       |
F1-06 (SelectIdentityPage) — richiede F1-01, F1-02, F1-03
```

**F1-01, F1-02, F1-03, F1-04 sono parallelizzabili.**

**Sequenza lineare pratica:**
1. F1-01 — Skeleton (~5 min)
2. F1-02 — useUsers (~15 min)
3. F1-03 — UserCard (~15 min)
4. F1-04 — PrivateRoute (~5 min)
5. F1-05 — App.tsx con PrivateRoute (~5 min)
6. F1-06 — SelectIdentityPage integrazione (~20 min)
7. Test per tutti i file (~30 min)

---

## 8. Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| `GET /api/wallets` ritorna 404 (no wallet files) | Media | Basso | Gestito nell'hook con messaggio "Nessun wallet configurato sul backend." |
| `tokens[i].token_ids` è `null` (backend schema lo permette: `list[int] \| None`) | Alta | Medio | Usare `t.balance` per il conteggio (non `t.token_ids.length`). `t.balance` è sempre `int` nel backend. |
| Nomi utenti con underscore o molto lunghi ("ente_organizzatore") | Media | Basso | `truncate` sulla classe del nome. Mostrare as-is senza formattare. |
| Health check e fetch utenti in parallelo: race condition | Bassa | Basso | Non è un problema: `useUsers` parte sempre, ma la sua sezione è visualizzata solo se `health?.status === 'ok'`. |
| `useNavigate()` chiamato fuori da `RouterProvider` | Bassa | Alto | `SelectIdentityPage` è renderizzata dentro `RouterProvider`. `PrivateRoute` usa `<Navigate>` componente, non il hook. |

---

## 9. Note Backend — Discrepanza Token Types

Il backend schema `TokenBalance` definisce:
```python
token_ids: list[int] | None = None  # ← può essere null!
balance: int                         # ← sempre intero
```

Il frontend type attuale in `types/api.ts`:
```ts
token_ids: number[]  // ← non nullable (bug potenziale)
```

**Decisione per la Fase 1:**
Usare `user.tokens.reduce((sum, t) => sum + t.balance, 0)` per il conteggio ticket. Il campo `balance` è garantito `int` dal backend, quindi sicuro. Il fix di `token_ids: number[] | null` in `types/api.ts` va fatto ma non blocca la Fase 1.

---

## 10. Riepilogo File

| Azione | File | Righe stimate |
|--------|------|---------------|
| CREARE | `src/components/Skeleton.tsx` | ~15 |
| CREARE | `src/hooks/useUsers.ts` | ~55 |
| CREARE | `src/components/UserCard.tsx` | ~65 |
| CREARE | `src/components/PrivateRoute.tsx` | ~20 |
| MODIFICARE | `src/App.tsx` | ~25 (da 21) |
| MODIFICARE | `src/pages/SelectIdentityPage.tsx` | ~140 (da 91) |
| CREARE | `src/components/Skeleton.test.tsx` | ~30 |
| CREARE | `src/components/UserCard.test.tsx` | ~80 |
| CREARE | `src/components/PrivateRoute.test.tsx` | ~40 |
| CREARE | `src/hooks/useUsers.test.ts` | ~70 |
| CREARE | `src/pages/SelectIdentityPage.test.tsx` | ~100 |
