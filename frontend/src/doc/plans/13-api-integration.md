---
id: 13
title: Integrazione API Backend
status: completed
priority: high
---

# Plan 13 — Integrazione API Backend

## Obiettivo
Creare hook React che chiamano il client Orval generato in Piano 12.
Sostituire i mock nelle pagine con i dati reali dell'API.
Mantenere il fallback ai mock quando `VITE_API_URL` non è impostato.

## Dipendenze
- Piano 12 completato (client Orval generato)
- Backend FastAPI attivo

## Task

### Layer enrichment (logica pura, senza React)
- [ ] Aggiungere `formatWei(weiString)` in `src/utils/format.js`
  - usa `ethers.formatEther`, restituisce stringa `"0.15 ETH"`
  - non rompere `formatEth` esistente
- [ ] Creare `src/api/enrichment/enrichListings.js`
  - input: array `ListingInfo` da API
  - arricchisce con `eventId` e `seat` da `LISTINGS` mock (lookup per `token_id`)
  - output: `{ tokenId, seller, priceWei, price, eventId, seat }`
- [ ] Creare `src/api/enrichment/enrichTickets.js`
  - input: array `TicketInfo` + set di tokenId in vendita
  - determina `status` ('owned' | 'listed') confrontando con `for-sale`
  - arricchisce con `eventId` e `seat` da `MY_TICKETS` mock
- [ ] Scrivere `enrichListings.test.js` (token nel mock, token non nel mock)
- [ ] Scrivere `enrichTickets.test.js` (owned, listed, assente nel mock)

### Hook API
- [ ] Creare `src/api/hooks/useForSaleListings.js`
  - chiama `getApiTicketsForSale()` generato da Orval
  - fallback mock se `!VITE_API_URL`
  - espone `{ listings, loading, error, refetch }`
- [ ] Creare `src/api/hooks/useMyTickets.js`
  - `Promise.all([ getApiTicketsUserAddress(address), getApiTicketsForSale() ])`
  - determina status owned/listed
  - fallback mock
  - espone `{ tickets, loading, error, refetch }`
- [ ] Creare `src/api/hooks/useWallet.js`
  - chiama `getApiWallets({ address })`
  - fallback mock `{ balanceEth: '0.00', nonce: 0 }`
  - espone `{ wallet, loading, error }`
- [ ] Scrivere test `useForSaleListings.test.js` (mock axios)
- [ ] Scrivere test `useMyTickets.test.js` (mock axios, verifica status)

### Aggiornamento pagine
- [ ] `EventPage.jsx`: sostituire `LISTINGS.filter(...)` con `useForSaleListings()`
  - aggiungere rendering skeleton durante loading
  - aggiungere messaggio errore
- [ ] `MyTicketsPage.jsx`: sostituire `MY_TICKETS` con `useMyTickets()`
  - aggiungere skeleton cards durante loading
- [ ] `TicketDetailPage.jsx`: usare `useMyTickets()` invece di `MY_TICKETS` diretto
- [ ] `ProfilePage.jsx`: usare `useMyTickets()` per conteggio owned + `useWallet()` per balance

### Configurazione
- [ ] Aggiornare `vite.config.js`: includere `src/api/enrichment/**` nella coverage
- [ ] Aggiornare `CLAUDE.md`: documentare `VITE_API_URL` e `npm run api:generate`
- [ ] Aggiornare `src/doc/index.md`: aggiungere Piano 12 e 13

## Struttura file risultanti

```
src/
  api/
    axiosInstance.ts            ← Piano 12
    generated/                  ← Piano 12, NON toccare
    enrichment/
      enrichListings.js
      enrichListings.test.js
      enrichTickets.js
      enrichTickets.test.js
    hooks/
      useForSaleListings.js
      useForSaleListings.test.js
      useMyTickets.js
      useMyTickets.test.js
      useWallet.js
  utils/
    format.js                   ← aggiungere formatWei
```

## Pattern fallback mock

Tutti gli hook seguono questo schema:

```javascript
const isApiConfigured = () => Boolean(import.meta.env.VITE_API_URL)

export function useForSaleListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!isApiConfigured()) {
      setListings(/* mock data arricchiti */)
      return
    }
    setLoading(true)
    try {
      const data = await getApiTicketsForSale()
      setListings(enrichApiListings(data))
    } catch (err) {
      setError(err.message)
      setListings(/* fallback silenzioso al mock */)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  return { listings, loading, error, refetch: fetchData }
}
```

## Note importanti

- `seat` e `eventId` vivono sempre nel mock — non esistono on-chain
- I `tokenId` nel mock devono corrispondere a quelli deployati per la demo
- `EVENTS` (mock sportivi) non vengono mai sostituiti dall'API
- `formatWei` usa `ethers.formatEther` già installato — nessuna dipendenza aggiuntiva
- In caso di errore API, il fallback mock garantisce che la demo funzioni sempre
