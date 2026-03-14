# Frontend — Mintpass

## Stack
- React + Vite 8
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- ethers.js v6
- react-router-dom

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
VITE_CHAIN_ID=1337
VITE_RPC_URL=http://192.168.2.208:8545
VITE_NFT_CONTRACT=          # da completare (backend)
VITE_MARKETPLACE_CONTRACT=  # da completare (backend)
```
