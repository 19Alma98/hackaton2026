---
id: 03
title: Web3 Context — ethers.js
status: completed
priority: high
---

# Plan 03 — Web3 Context

## Obiettivo
Gestione centralizzata della connessione wallet via ethers.js v6.

## Dipendenze
- Plan 01 (routing)

## Packages da installare
- `ethers`

## Task

- [ ] Installare `ethers`
- [ ] Creare `src/context/Web3Context.jsx`
- [ ] Creare `src/hooks/useWeb3.js` (shortcut per consumare il context)
- [ ] Esporre dal context:
  - `address` — indirizzo wallet connesso (null se non connesso)
  - `signer` — ethers Signer
  - `provider` — BrowserProvider
  - `isConnected` — booleano
  - `connect()` — richiede account MetaMask
  - `disconnect()` — resetta stato locale
- [ ] Variabili d'ambiente:
  - `VITE_CHAIN_ID=1337`
  - `VITE_RPC_URL=http://192.168.2.208:8545`
- [ ] Gestire eventi:
  - `accountsChanged` → aggiorna address
  - `chainChanged` → reload pagina
- [ ] Avvolgere `<App>` con `<Web3Provider>` in `main.jsx`
- [ ] Creare `frontend/.env` con le variabili

## File risultanti
```
src/
  context/
    Web3Context.jsx
  hooks/
    useWeb3.js
frontend/
  .env
  .env.example
```
