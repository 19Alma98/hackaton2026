---
id: 08
title: TicketDetailPage — dettaglio biglietto
status: completed
priority: medium
---

# Plan 08 — TicketDetailPage

## Obiettivo
Dettaglio di un singolo NFT biglietto con QR code e opzione di messa in vendita.

## Dipendenze
- Plan 01 (routing — params `:tokenId`)
- Plan 07 (MyTicketsPage)

## Packages da installare
- `qrcode.react`

## Task

- [ ] Installare `qrcode.react`
- [ ] Card grande con gradiente (stesso di MyTicketsPage)
- [ ] Info biglietto:
  - Nome evento
  - Data e orario
  - Luogo
  - Posto/Seat
  - Token ID (piccolo, monospaciato)
- [ ] QR code mock (encode: `mintpass://ticket/{tokenId}`)
- [ ] Badge status prominente
- [ ] Se status "owned":
  - Bottone "Metti in vendita"
  - → input prezzo ETH + bottone "Conferma" (mock)
- [ ] Se status "listed":
  - Prezzo attuale
  - Bottone "Ritira dalla vendita" (mock)

## Note UI
- QR code centrato, sfondo bianco con padding (necessario per leggibilità)
- Bottom sheet per inserimento prezzo
