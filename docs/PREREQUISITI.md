# Prerequisiti

Per contribuire al progetto e avviare la rete blockchain in locale servono i seguenti strumenti installati sul tuo PC.

## Obbligatori

### Docker

- **Cosa serve:** [Docker](https://docs.docker.com/get-docker/) installato e avviato.
- **Perché:** i 5 nodi della rete privata girano in container. Anche in sviluppo locale usiamo Docker per avere un ambiente uniforme.
- **Verifica:** da terminale esegui `docker --version` e assicurati che il daemon sia attivo (`docker info` o avvio da GUI).

### Docker Compose

- **Cosa serve:** [Docker Compose](https://docs.docker.com/compose/install/) (v2 preferibile, integrato in `docker compose`).
- **Perché:** usiamo un file `docker-compose` per definire e avviare i 5 nodi con un solo comando (utile per test su un solo host).
- **Verifica:** `docker compose version` oppure `docker-compose --version`.

### Python 3.x

- **Cosa serve:** [Python](https://www.python.org/downloads/) 3.8 o superiore (consigliato 3.10+).
- **Perché:** usato per Brownie (compilazione, test e deploy degli smart contract) e, se presente, per l’API backend (FastAPI/Flask).
- **Verifica:** `python3 --version` oppure `python --version`.

## Opzionali (a seconda del tuo ruolo)

- **Node.js / npm:** se lavori anche sul frontend della dApp.
- **MetaMask (o altro wallet):** per testare acquisto/vendita biglietti sulla rete privata dal browser.
- **Git:** per clonare il repository e contribuire (presunto già installato se stai leggendo questo file nel repo).

## Riepilogo comandi di verifica

```bash
docker --version
docker compose version   # oppure: docker-compose --version
python3 --version
```

Se tutti i comandi restituiscono una versione, il tuo ambiente è pronto per clonare il repo e avviare i 5 nodi come descritto nel [README principale](../README.md).
