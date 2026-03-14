# Deployment su PC separati in LAN

Guida tecnica per avviare la rete Clique su macchine separate nella stessa LAN.

> **Cerchi istruzioni operative copia-incolla?** Vedi [RUNBOOK.md](RUNBOOK.md)
> per la guida passo-passo per ogni operatore.

## Prerequisiti (ogni PC)

- Docker Engine >= 24
- Docker Compose v2
- Porte aperte nel firewall locale:
  - **8545/tcp** (JSON-RPC)
  - **30303/tcp + udp** (P2P Geth)

## Mappa nodi → indirizzi

Ogni nodo ha un indirizzo Ethereum fisso (derivato dalla mnemonic di default).
Assegnate un PC a ciascun nodo:

| Nodo | Indirizzo                                    |
|------|----------------------------------------------|
| 1    | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| 2    | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| 3    | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| 4    | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |
| 5    | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` |

## Passo 1 — Raccogliere gli IP LAN

Ogni operatore comunica il proprio IP LAN (es. `ip addr` su Linux).
Esempio:

| PC | Nodo | IP LAN         |
|----|------|----------------|
| 1  | 1    | 192.168.1.10   |
| 2  | 2    | 192.168.1.11   |
| 3  | 3    | 192.168.1.12   |
| 4  | 4    | 192.168.1.13   |
| 5  | 5    | 192.168.1.14   |

## Passo 2 — Rigenerare config con IP LAN

**Da un solo PC** (quello che ha il repo), rigenerare i file con gli IP reali:

```bash
cd blockchain

uv run python scripts/generate_keys.py \
    --hosts "192.168.1.10,192.168.1.11,192.168.1.12,192.168.1.13,192.168.1.14"
```

Questo rigenera `config.toml` e `static-nodes.json` con gli enode che puntano
agli IP LAN invece che ai nomi Docker.

## Passo 3 — Distribuire i file a ogni PC

Ogni PC ha bisogno di questi file dalla cartella `blockchain/`:

```
blockchain/
├── docker-compose.node.yml
├── entrypoint.sh
├── genesis.json
├── config.toml          ← rigenerato al passo 2
├── password.txt
└── nodes/
    └── nodeN/           ← solo la cartella del proprio nodo
        ├── keystore/
        │   └── UTC--nodeN--...
        └── nodekey
```

Usate `scp`, una chiavetta USB, o una cartella condivisa. Esempio per il PC 3:

```bash
scp -r blockchain/{docker-compose.node.yml,entrypoint.sh,genesis.json,config.toml,password.txt} user@192.168.1.12:~/blockchain/
scp -r blockchain/nodes/node3 user@192.168.1.12:~/blockchain/nodes/
```

## Passo 4 — Avviare il nodo su ogni PC

Su ogni PC, entrare nella cartella `blockchain/` e avviare con le variabili
corrette. Esempio per il **PC 3 (nodo 3)**:

```bash
cd ~/blockchain

NODE_NUM=3 \
NODE_ADDRESS=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC \
docker compose -f docker-compose.node.yml up -d
```

Tabella riepilogativa dei comandi per ogni PC:

```bash
# PC 1
NODE_NUM=1 NODE_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 docker compose -f docker-compose.node.yml up -d

# PC 2
NODE_NUM=2 NODE_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 docker compose -f docker-compose.node.yml up -d

# PC 3
NODE_NUM=3 NODE_ADDRESS=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC docker compose -f docker-compose.node.yml up -d

# PC 4
NODE_NUM=4 NODE_ADDRESS=0x90F79bf6EB2c4f870365E785982E1f101E93b906 docker compose -f docker-compose.node.yml up -d

# PC 5
NODE_NUM=5 NODE_ADDRESS=0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 docker compose -f docker-compose.node.yml up -d
```

## Passo 5 — Verificare la connettivita

Dallo **stesso PC** o da un PC qualsiasi nella LAN, eseguire lo script di
verifica:

```bash
# Single-host (tutti i nodi sullo stesso PC)
uv run python scripts/check_peers.py

# Multi-PC LAN
uv run python scripts/check_peers.py \
    --hosts "192.168.1.10,192.168.1.11,192.168.1.12,192.168.1.13,192.168.1.14"
```

Lo script interroga `admin_peers` e `eth_blockNumber` su ogni nodo e stampa
una tabella riassuntiva. Exit code 0 = tutti connessi.

## Troubleshooting

| Problema | Possibile causa | Soluzione |
|----------|----------------|-----------|
| `admin.peers` vuoto | Firewall blocca porta 30303 | Aprire 30303/tcp e 30303/udp |
| Peer count < 4 | IP errato in config.toml | Verificare gli IP e rigenerare |
| `eth_blockNumber` = 0 | Nessun sealer attivo | Controllare che `--mine` sia presente e l'account sia sbloccato |
| Connessione RPC rifiutata | Firewall blocca 8545 | Aprire 8545/tcp oppure verificare `--http.addr 0.0.0.0` |
| Genesis mismatch | genesis.json diversi | Ricopiare lo stesso genesis.json su tutti i PC |
