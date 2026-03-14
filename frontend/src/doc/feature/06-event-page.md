---
id: 06
title: EventPage — dettaglio evento e acquisto
status: completed
priority: high
---

# Plan 06 — EventPage

## Obiettivo
Dettaglio di un evento con lista biglietti disponibili nel marketplace e flusso acquisto.

## Dipendenze
- Plan 01 (routing — params `:id`)
- Plan 03 (Web3 context — per transazione)
- Plan 04 (mock data)

## Task

- [ ] Header: gradiente colorato con nome evento sovrapposto
- [ ] Back button (← torna a Home)
- [ ] Info evento: data, luogo, descrizione breve
- [ ] Sezione "Biglietti disponibili":
  - Lista card biglietto:
    - Seat label
    - Prezzo in ETH
    - Indirizzo venditore troncato
    - Bottone "Compra"
- [ ] Flusso acquisto mock:
  1. Tap "Compra" → mostra modal/sheet di conferma
  2. Conferma → loading spinner
  3. Successo → toast "Biglietto acquistato!" + redirect a `/tickets`
  4. Errore → toast errore
- [ ] Empty state se nessun biglietto disponibile

## Note UI
- Bottom sheet per conferma acquisto (non modal fullscreen)
- Prezzo in ETH grande e leggibile
- Bottone "Compra" accent color (viola)
