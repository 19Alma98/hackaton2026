---
id: 07
title: MyTicketsPage — i miei biglietti
status: completed
priority: high
---

# Plan 07 — MyTicketsPage

## Obiettivo
Visualizzazione degli NFT biglietti posseduti dall'utente connesso.

## Dipendenze
- Plan 01 (routing)
- Plan 03 (Web3 context — address per filtrare i biglietti)
- Plan 04 (mock data)

## Task

- [ ] Header: "I miei biglietti" + contatore totale
- [ ] Griglia 2 colonne di NFT card
- [ ] Ogni NFT card:
  - Gradiente colorato deterministico basato su `tokenId`
  - Nome evento
  - Data
  - Seat label
  - Badge status: "In tuo possesso" (verde) / "In vendita" (arancio)
- [ ] Tap card → naviga a `/ticket/:tokenId`
- [ ] Empty state se nessun biglietto:
  - Illustrazione/icona
  - Testo: "Nessun biglietto ancora"
  - Bottone "Scopri eventi" → `/home`

## Note UI
- Griglia 2 colonne fissa, no scroll orizzontale
- Card con aspect ratio quadrato o 4:3
- Gradiente: funzione `tokenIdToGradient(id)` in `src/utils/colors.js`
