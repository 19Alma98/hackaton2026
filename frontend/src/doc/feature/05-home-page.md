---
id: 05
title: HomePage — scopri eventi
status: completed
priority: high
---

# Plan 05 — HomePage

## Obiettivo
Schermata principale: lista eventi disponibili con accesso al marketplace.

## Dipendenze
- Plan 01 (routing)
- Plan 03 (Web3 context — per mostrare indirizzo e balance)
- Plan 04 (mock data)

## Task

- [ ] Header sticky:
  - Avatar (gradiente da address)
  - Indirizzo troncato (es. `0x1234...abcd`)
  - Balance ETH
- [ ] Sezione "In evidenza": hero card evento grande (prima card della lista)
- [ ] Sezione "Prossimi eventi": lista verticale card compatte
- [ ] Ogni card evento:
  - Colore/gradiente placeholder (no immagini reali per ora)
  - Nome evento
  - Data formattata
  - Luogo
  - Prezzo minimo in ETH
  - Bottone/freccia "Vedi biglietti"
- [ ] Tap card → naviga a `/event/:id`

## Note UI
- Scroll verticale, no scroll orizzontale
- Card con border radius grande, subtle shadow
- Header non occupa troppo spazio (mobile)
