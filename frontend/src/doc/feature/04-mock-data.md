---
id: 04
title: Mock data
status: completed
priority: high
---

# Plan 04 — Mock Data

## Obiettivo
Dati fittizi per sviluppare UI in parallelo al backend/contratti.

## Dipendenze
- Nessuna

## Task

- [ ] Creare `src/mock/events.js` — lista eventi
- [ ] Creare `src/mock/tickets.js` — biglietti posseduti + in marketplace
- [ ] Creare `src/mock/index.js` — re-export tutto

## Struttura dati

### Evento
```js
{
  id: 'evt-01',
  name: 'Concerto Radiohead',
  date: '2026-06-15T21:00:00',
  venue: 'Mediolanum Forum, Milano',
  description: '...',
  image: null, // placeholder color
  minPrice: '0.05', // ETH
  availableTickets: 12,
}
```

### Biglietto (posseduto)
```js
{
  tokenId: '42',
  eventId: 'evt-01',
  seat: 'Settore A - Fila 3 - Posto 12',
  status: 'owned', // 'owned' | 'listed'
  listingPrice: null, // ETH se in vendita
}
```

### Listing (marketplace)
```js
{
  tokenId: '17',
  eventId: 'evt-02',
  seat: 'Prato',
  price: '0.08', // ETH
  seller: '0xAbc...123',
}
```
