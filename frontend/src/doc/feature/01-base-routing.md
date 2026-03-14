---
id: 01
title: Struttura base e routing
status: completed
priority: high
---

# Plan 01 — Struttura base e routing

## Obiettivo
Creare lo scheletro navigabile dell'app con routing e layout bottom nav.

## Dipendenze
- Nessuna

## Packages da installare
- `react-router-dom`

## Task

- [ ] Installare `react-router-dom`
- [ ] Creare `src/layouts/AppLayout.jsx` con `<BottomNav>` fisso in basso
- [ ] Creare `src/components/BottomNav.jsx` (tab: Home, Biglietti, Profilo)
- [ ] Creare pagine placeholder:
  - `src/pages/ConnectPage.jsx`
  - `src/pages/HomePage.jsx`
  - `src/pages/MyTicketsPage.jsx`
  - `src/pages/ProfilePage.jsx`
  - `src/pages/EventPage.jsx`
  - `src/pages/TicketDetailPage.jsx`
- [ ] Configurare routes in `src/App.jsx`
- [ ] Redirect: se wallet non connesso → `/`, altrimenti → `/home`

## Struttura file risultante
```
src/
  pages/
    ConnectPage.jsx
    HomePage.jsx
    MyTicketsPage.jsx
    ProfilePage.jsx
    EventPage.jsx
    TicketDetailPage.jsx
  layouts/
    AppLayout.jsx
  components/
    BottomNav.jsx
  App.jsx
```
