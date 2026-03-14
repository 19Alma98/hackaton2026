# Mintpass — Frontend Documentation Index

Stack: **React + Vite 8 + Tailwind CSS v4 + ethers.js v6**
Design: dark mode, mobile-first, bottom navigation

---

## Plans (`src/doc/plans/`)

Piani di implementazione ordinati per priorità di sviluppo.

| ID | File | Titolo | Status | Priorità |
|----|------|--------|--------|----------|
| 01 | [01-base-routing.md](./feature/01-base-routing.md) | Struttura base e routing | ✅ completed | high |
| 02 | [02-connect-page.md](./feature/02-connect-page.md) | ConnectPage — splash e onboarding | ✅ completed | high |
| 03 | [03-web3-context.md](./feature/03-web3-context.md) | Web3 Context — ethers.js | ❌ annullato | — |
| 04 | [04-mock-data.md](./feature/04-mock-data.md) | Mock data | ✅ completed | high |
| 05 | [05-home-page.md](./feature/05-home-page.md) | HomePage — scopri eventi | ✅ completed | high |
| 06 | [06-event-page.md](./feature/06-event-page.md) | EventPage — dettaglio e acquisto | ✅ completed | high |
| 07 | [07-my-tickets-page.md](./feature/07-my-tickets-page.md) | MyTicketsPage — i miei biglietti | ✅ completed | high |
| 08 | [08-ticket-detail-page.md](./feature/08-ticket-detail-page.md) | TicketDetailPage — dettaglio biglietto | ✅ completed | medium |
| 09 | [09-profile-page.md](./feature/09-profile-page.md) | ProfilePage — wallet e profilo | ✅ completed | medium |
| 10 | [10-contract-integration.md](./plans/10-contract-integration.md) | Integrazione contratti reali | ❌ annullato | — |
| 11 | [11-polish.md](./feature/11-polish.md) | Polish — dettagli visivi e UX | ✅ completed | medium |
| 12 | [12-orval-setup.md](./plans/12-orval-setup.md) | Orval — generazione client API | ✅ completed | high |
| 13 | [13-api-integration.md](./plans/13-api-integration.md) | Integrazione API Backend | ✅ completed | high |

---

## Features (`src/doc/feature/`)

| File | Titolo |
|------|--------|
| [01-base-routing.md](./feature/01-base-routing.md) | Struttura base e routing |
| [02-connect-page.md](./feature/02-connect-page.md) | ConnectPage — splash e onboarding |
| [03-web3-context.md](./feature/03-web3-context.md) | Web3 Context — ethers.js |
| [04-mock-data.md](./feature/04-mock-data.md) | Mock data |
| [05-home-page.md](./feature/05-home-page.md) | HomePage — scopri eventi |
| [06-event-page.md](./feature/06-event-page.md) | EventPage — dettaglio e acquisto |
| [07-my-tickets-page.md](./feature/07-my-tickets-page.md) | MyTicketsPage — i miei biglietti |
| [08-ticket-detail-page.md](./feature/08-ticket-detail-page.md) | TicketDetailPage — dettaglio biglietto |
| [09-profile-page.md](./feature/09-profile-page.md) | ProfilePage — wallet e profilo |
| [11-polish.md](./feature/11-polish.md) | Polish — dettagli visivi e UX |

---

## Convenzione status

- `planned` — da iniziare
- `in-progress` — in lavorazione
- `completed` — implementato, spostare il file in `feature/`
- `blocked` — in attesa di dipendenze esterne (es. backend)
