# Frontend — Mintpass

## Stack
- React + Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- react-router-dom
- axios (via orval-generated client)

## Architettura API

Il frontend **non chiama la blockchain direttamente**. Tutte le chiamate passano dal backend FastAPI:

- Client generato da Orval in `src/api/generated/`
- Hook React in `src/api/hooks/` (`useMyTickets`, `useForSaleListings`, `useWallet`)
- Autenticazione via `AuthContext` (indirizzo wallet selezionato dall'utente)
- `axiosInstance.ts` configura la baseURL: `VITE_API_URL ?? 'http://localhost:8000'`

**Non usare** `Web3Context`, `useNFT`, `useMarketplace`, `WrongNetworkBanner` — eliminati.

## Documentazione

Il file `src/doc/index.md` è l'indice di tutta la documentazione frontend.

**Leggilo sempre per primo** per avere il contesto aggiornato dei piani e delle feature.

- `src/doc/plans/` — piani di implementazione (uno per feature/schermata)
- `src/doc/feature/` — piani completamente sviluppati (feature pronte)

Leggi il contenuto completo di un plan **solo su richiesta esplicita** o quando stai lavorando attivamente su quella sezione.

## Convenzioni

- **Dark mode** di default (`bg-gray-950` come base)
- **Mobile-first**: layout pensato per 375–430px, poi desktop
- **Bottom navigation** su mobile (mai sidebar)
- Aggiorna lo `status` nel frontmatter del plan quando inizi a lavorarci (`in-progress`) e spostalo in `feature/` quando è completato (`completed`)
- Aggiorna la tabella in `index.md` dopo ogni cambio di status

## Variabili d'ambiente

```
VITE_API_URL=http://localhost:8000
```
