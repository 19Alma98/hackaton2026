---
id: 09
title: ProfilePage — wallet e profilo
status: completed
priority: medium
---

# Plan 09 — ProfilePage

## Obiettivo
Schermata profilo utente con info wallet e disconnessione.

## Dipendenze
- Plan 01 (routing)
- Plan 03 (Web3 context)

## Task

- [ ] Avatar generato dall'address (gradiente deterministico, cerchio)
- [ ] Indirizzo wallet completo con bottone copia (clipboard API)
- [ ] Balance ETH aggiornato
- [ ] Sezione statistiche mock:
  - Biglietti in mio possesso
  - Biglietti acquistati (storico)
  - Biglietti venduti (storico)
- [ ] Bottone "Disconnetti wallet"
  - → resetta stato Web3Context
  - → redirect a `/`

## Note UI
- Layout a sezioni con divisori sottili
- Stats in griglia 3 colonne (numeri grandi, label piccola)
- Bottone disconnetti: rosso/rose, in fondo alla pagina
