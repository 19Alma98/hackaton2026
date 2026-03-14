---
id: 11
title: Polish — dettagli visivi e UX
status: completed
priority: medium
---

# Plan 11 — Polish

## Obiettivo
Rifinitura visiva e UX da fare nell'ultima ora disponibile.

## Dipendenze
- Tutti i piani precedenti completati

## Task

- [ ] Transizioni tra pagine (fade semplice con CSS)
- [ ] Skeleton loader sulle card (mentre i dati caricano)
- [ ] Toast notifications:
  - Successo acquisto biglietto
  - Successo messa in vendita
  - Errore transazione MetaMask (rejected)
  - Errore wrong network
- [ ] Gestione "wrong network":
  - Se chainId !== 1337 → banner in alto "Connettiti alla rete Mintpass"
  - Bottone "Cambia rete" (aggiunge automaticamente la rete a MetaMask)
- [ ] Responsive check finale (375px, 390px, 430px)

## Note
- Non aggiungere animazioni pesanti — priorità a stabilità
- Toast: implementazione leggera custom (no librerie extra se possibile)
