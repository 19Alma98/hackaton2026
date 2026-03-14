---
id: 10
title: Integrazione contratti reali
status: blocked
priority: high
blockedBy: backend (ABI + indirizzi contratti)
---

# Plan 10 — Integrazione contratti reali

## Obiettivo
Sostituire mock data con chiamate reali ai contratti ERC-721 e Marketplace deployati.

## Dipendenze
- Plan 03 (Web3 context)
- Plan 04 (mock data — da sostituire)
- **Backend**: ABI contratto NFT + ABI Marketplace + indirizzi deployati

## Task

- [ ] Ricevere dal backend:
  - ABI `TicketNFT.json`
  - ABI `Marketplace.json`
  - `VITE_NFT_CONTRACT=0x...`
  - `VITE_MARKETPLACE_CONTRACT=0x...`
- [ ] Aggiornare `.env` con gli indirizzi
- [ ] Creare `src/contracts/TicketNFT.js` (ABI + address)
- [ ] Creare `src/contracts/Marketplace.js` (ABI + address)
- [ ] Creare `src/hooks/useNFT.js`:
  - `balanceOf(address)` → numero token posseduti
  - `tokenOfOwnerByIndex(address, index)` → tokenId
  - `tokenURI(tokenId)` → metadati URI
- [ ] Creare `src/hooks/useMarketplace.js`:
  - `getListings()` → biglietti in vendita
  - `buy(tokenId)` → acquisto (payable)
  - `list(tokenId, priceWei)` → messa in vendita
  - `delist(tokenId)` → ritiro dalla vendita
- [ ] Sostituire mock nei componenti con i hook reali
- [ ] Gestire stati: loading, error, success per ogni transazione

## Note
- Le transazioni (`buy`, `list`, `delist`) richiedono `signer` da Web3Context
- Le letture (`getListings`, `balanceOf`) usano `provider` (no firma)
