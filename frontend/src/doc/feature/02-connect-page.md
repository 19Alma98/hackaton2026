---
id: 02
title: ConnectPage — splash e onboarding
status: completed
priority: high
---

# Plan 02 — ConnectPage

## Obiettivo
Schermata di ingresso: connessione MetaMask, fullscreen dark.

## Dipendenze
- Plan 01 (routing)
- Plan 03 (Web3 context, per `connect()`)

## Task

- [ ] Layout fullscreen centrato, dark background
- [ ] Logo "Mintpass" con icona (SVG placeholder o emoji)
- [ ] Tagline: *"I tuoi biglietti, sulla blockchain"*
- [ ] Bottone grande "Connetti MetaMask"
- [ ] Stato loading durante connessione (spinner)
- [ ] Errore: MetaMask non installato → messaggio + link download
- [ ] Dopo connessione → redirect `/home`

## Note UI
- Gradiente sottile sul background (gray-950 → gray-900)
- Bottone accent: viola/indigo, bordi arrotondati grandi
- Font size grande, impatto visivo da splash screen
