# Runbook operativo – Rete Geth Clique PoA

Guida passo-passo per avviare e verificare la rete blockchain privata.
Ogni comando è da copiare e incollare così com'è.

---

## Mappa del team

| PC | Operatore | Nodo | Indirizzo Ethereum | IP LAN |
|----|-----------|------|--------------------|--------|
| 1  | Ale M     | 1    | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `192.168.2.208` |
| 2  | Ale Z     | 2    | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `192.168.3.230` |
| 3  | Robert    | 3    | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `192.168.2.165` |

> Se gli IP cambiano (es. riconnessione Wi-Fi), aggiornate la tabella qui sopra
> e ripetete dal **Passo 2** in avanti.

---

## Prerequisiti – checklist per OGNI PC

Prima di iniziare, ogni operatore verifica sul proprio PC:

```bash
# Docker installato e funzionante?
docker --version
# atteso: Docker version 24.x o superiore

# Docker Compose v2 disponibile?
docker compose version
# atteso: Docker Compose version v2.x

# Porte libere? (non devono esserci altri servizi)
ss -tlnp | grep -E '8545|30303'
# atteso: nessun output (porte libere)
```

Se una porta è occupata, fermate il servizio che la usa prima di proseguire.

**Firewall** – assicuratevi che queste porte siano aperte:
- `8545/tcp` (JSON-RPC)
- `30303/tcp` e `30303/udp` (P2P Geth)

```bash
# Ubuntu/Debian con ufw:
sudo ufw allow 8545/tcp
sudo ufw allow 30303/tcp
sudo ufw allow 30303/udp
```

---

## Istruzioni per PC 1 (Ale M – Coordinatore)

PC 1 è il coordinatore: genera le configurazioni e le distribuisce agli altri.

### Passo 1 – Raccogliere gli IP

Chiedete a ciascun operatore il proprio IP LAN:

```bash
# Ogni operatore esegue questo sul proprio PC:
ip -4 addr show | grep -oP '(?<=inet\s)192\.168\.\S+'
```

Aggiornate la tabella in cima a questo documento con gli IP corretti.

### Passo 2 – Generare chiavi e configurazione

Dalla root del progetto (`hackaton2026/`):

```bash
cd ~/myworks/hackaton2026/blockchain

uv run python scripts/generate_keys.py \
    --hosts "192.168.2.208,192.168.3.230,192.168.2.165"
```

> Sostituite gli IP con quelli reali se sono cambiati.

Verificate che i file siano stati generati:

```bash
ls -la genesis.json config.toml static-nodes.json password.txt
ls -la nodes/node1/keystore/ nodes/node1/nodekey
ls -la nodes/node2/keystore/ nodes/node2/nodekey
ls -la nodes/node3/keystore/ nodes/node3/nodekey
```

### Passo 3 – Distribuire i file agli altri PC

**A PC 2 (Ale Z – 192.168.3.230):**

```bash
# File comuni
scp docker-compose.node.yml entrypoint.sh genesis.json config.toml password.txt \
    user@192.168.3.230:~/blockchain/

# Chiavi del nodo 2
scp -r nodes/node2 user@192.168.3.230:~/blockchain/nodes/
```

**A PC 3 (Robert – 192.168.2.165):**

```bash
# File comuni
scp docker-compose.node.yml entrypoint.sh genesis.json config.toml password.txt \
    user@192.168.2.165:~/blockchain/

# Chiavi del nodo 3
scp -r nodes/node3 user@192.168.2.165:~/blockchain/nodes/
```

> Se `scp` non funziona, copiate i file tramite chiavetta USB o cartella condivisa.
> Ogni PC deve avere questa struttura:
>
> ```
> ~/blockchain/
> ├── docker-compose.node.yml
> ├── entrypoint.sh
> ├── genesis.json
> ├── config.toml
> ├── password.txt
> └── nodes/
>     └── nodeN/
>         ├── keystore/
>         │   └── UTC--nodeN--...
>         └── nodekey
> ```

### Passo 4 – Avviare il nodo 1

```bash
cd ~/myworks/hackaton2026/blockchain

NODE_NUM=1 \
NODE_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
docker compose -f docker-compose.node.yml up -d
```

Verificate che il container sia partito:

```bash
docker compose -f docker-compose.node.yml ps
```

Atteso: stato `running` (o `Up`).

### Passo 5 – Confermare agli altri che il nodo 1 è attivo

Comunicate agli operatori di PC 2 e PC 3 che possono avviare i loro nodi.

### Passo 6 – Verificare la rete (dopo che TUTTI i nodi sono attivi)

```bash
cd ~/myworks/hackaton2026

uv run python blockchain/scripts/check_peers.py \
    --hosts "192.168.2.208,192.168.3.230,192.168.2.165"
```

Output atteso:

```
Node     Endpoint                     Peers    Block  Status
--------------------------------------------------------------
nodo1    http://192.168.2.208:8545        2        N  OK
nodo2    http://192.168.3.230:8545        2        N  OK
nodo3    http://192.168.2.165:8545        2        N  OK

Reachable: 3/3
All nodes fully connected.
```

In alternativa, verifica rapida tramite curl:

```bash
# Quanti peer vede il nodo 1?
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'
# atteso: "result":"0x2" (2 peer)

# I blocchi avanzano?
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
# atteso: un numero che cresce ogni ~5 secondi
```

---

## Istruzioni per PC 2 (Ale Z)

### Passo 1 – Verificare di avere i file

PC 1 (Ale M) vi invierà i file. Verificate che siano arrivati:

```bash
ls -la ~/blockchain/docker-compose.node.yml
ls -la ~/blockchain/entrypoint.sh
ls -la ~/blockchain/genesis.json
ls -la ~/blockchain/config.toml
ls -la ~/blockchain/password.txt
ls -la ~/blockchain/nodes/node2/keystore/
ls -la ~/blockchain/nodes/node2/nodekey
```

Se manca qualcosa, chiedete a PC 1 di rinviare i file.

### Passo 2 – Rendere eseguibile l'entrypoint

```bash
chmod +x ~/blockchain/entrypoint.sh
```

### Passo 3 – Avviare il nodo 2

Attendete conferma da PC 1 che il nodo 1 è attivo, poi:

```bash
cd ~/blockchain

NODE_NUM=2 \
NODE_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
docker compose -f docker-compose.node.yml up -d
```

### Passo 4 – Verificare che il container sia partito

```bash
docker compose -f docker-compose.node.yml ps
```

Atteso: stato `running` (o `Up`).

### Passo 5 – Verificare la connettività (opzionale)

```bash
# Quanti peer vede il mio nodo?
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'
# atteso: "result":"0x2" (2 peer, dopo che tutti e 3 i nodi sono attivi)

# I blocchi avanzano?
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Passo 6 – Comunicare che il nodo è attivo

Confermate a PC 1 che il nodo 2 è up.

---

## Istruzioni per PC 3 (Robert)

### Passo 1 – Verificare di avere i file

PC 1 (Ale M) vi invierà i file. Verificate che siano arrivati:

```bash
ls -la ~/blockchain/docker-compose.node.yml
ls -la ~/blockchain/entrypoint.sh
ls -la ~/blockchain/genesis.json
ls -la ~/blockchain/config.toml
ls -la ~/blockchain/password.txt
ls -la ~/blockchain/nodes/node3/keystore/
ls -la ~/blockchain/nodes/node3/nodekey
```

Se manca qualcosa, chiedete a PC 1 di rinviare i file.

### Passo 2 – Rendere eseguibile l'entrypoint

```bash
chmod +x ~/blockchain/entrypoint.sh
```

### Passo 3 – Avviare il nodo 3

Attendete conferma da PC 1 che il nodo 1 è attivo, poi:

```bash
cd ~/blockchain

NODE_NUM=3 \
NODE_ADDRESS=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC \
docker compose -f docker-compose.node.yml up -d
```

### Passo 4 – Verificare che il container sia partito

```bash
docker compose -f docker-compose.node.yml ps
```

Atteso: stato `running` (o `Up`).

### Passo 5 – Verificare la connettività (opzionale)

```bash
# Quanti peer vede il mio nodo?
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}'
# atteso: "result":"0x2" (2 peer, dopo che tutti e 3 i nodi sono attivi)

# I blocchi avanzano?
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Passo 6 – Comunicare che il nodo è attivo

Confermate a PC 1 che il nodo 3 è up.

---

## Spegnimento e reset

### Fermare il nodo (dati preservati)

Eseguire sul proprio PC:

```bash
cd ~/blockchain
docker compose -f docker-compose.node.yml down
```

### Reset completo (cancella dati blockchain)

```bash
cd ~/blockchain
docker compose -f docker-compose.node.yml down -v
```

Dopo un reset, al prossimo `up` il genesis verrà re-inizializzato automaticamente.

### Riavviare dopo uno spegnimento (senza reset)

Stesso comando dell'avvio. Es. per PC 1:

```bash
cd ~/myworks/hackaton2026/blockchain

NODE_NUM=1 \
NODE_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
docker compose -f docker-compose.node.yml up -d
```

---

## Scenario single-host (tutti i nodi su un solo PC)

Per sviluppo e test, potete avviare tutti e 3 i nodi su un singolo PC
usando il docker-compose multi-servizio:

```bash
cd ~/myworks/hackaton2026/blockchain

# Rigenerare con nomi Docker (senza --hosts)
uv run python scripts/generate_keys.py

# Avviare tutti i nodi
docker compose up -d

# Verificare
docker compose ps
uv run python scripts/check_peers.py
```

Endpoint RPC in questo scenario:

| Nodo | URL RPC |
|------|---------|
| 1    | `http://localhost:8545` |
| 2    | `http://localhost:8546` |
| 3    | `http://localhost:8547` |

---

## MetaMask – Aggiungere la rete

Su ogni PC che vuole interagire con la chain:

1. Aprite MetaMask → Impostazioni → Reti → Aggiungi rete
2. Compilate:

| Campo | Valore |
|-------|--------|
| Nome rete | Hackathon Private |
| URL RPC | `http://localhost:8545` (o l'IP LAN del nodo più vicino) |
| Chain ID | `1337` |
| Simbolo valuta | ETH |

---

## Troubleshooting

| Problema | Causa probabile | Soluzione |
|----------|-----------------|-----------|
| Container non parte | Porta già occupata | `ss -tlnp \| grep 8545` → fermare il processo che la occupa |
| `admin.peers` vuoto | Firewall blocca 30303 | `sudo ufw allow 30303/tcp && sudo ufw allow 30303/udp` |
| Peer count < 2 | IP errato in config.toml | Verificare IP, rigenerare con `generate_keys.py --hosts`, ridistribuire |
| `eth_blockNumber` fermo a 0 | Sealer non attivo | Verificare che `--mine` sia nel comando e l'account sia sbloccato |
| Connessione RPC rifiutata | Firewall blocca 8545 | `sudo ufw allow 8545/tcp` |
| Genesis mismatch (nodi non si sincronizzano) | genesis.json diverso tra PC | Ricopiare lo stesso genesis.json su tutti i PC, poi `docker compose down -v` e riavviare |
| Permesso negato su entrypoint.sh | File non eseguibile | `chmod +x ~/blockchain/entrypoint.sh` |
| I log dicono "unauthorized signer" | L'indirizzo del nodo non è tra i sealer del genesis | Rigenerare tutto con `generate_keys.py` e ridistribuire |

### Leggere i log del nodo

```bash
docker compose -f docker-compose.node.yml logs -f --tail 50
```

Cercate:
- `Looking for peers` → il nodo sta cercando peer (normale all'inizio)
- `Block synchronisation started` → si sta sincronizzando
- `Successfully sealed new block` → sta producendo blocchi (tutto ok)
- `Unauthorized signer` → problema di configurazione (vedi tabella sopra)

---

## Sequenza temporale di avvio (riassunto)

```
PC 1 (Ale M)          PC 2 (Ale Z)          PC 3 (Robert)
─────────────          ─────────────          ──────────────
1. Raccoglie IP
2. Genera config
3. Invia file ───────→ Riceve file
   Invia file ────────────────────────────→ Riceve file
4. Avvia nodo 1
5. "Nodo 1 OK" ─────→ Avvia nodo 2
                       "Nodo 2 OK" ──────→ Avvia nodo 3
                                            "Nodo 3 OK"
6. check_peers.py
   "Rete OK ✓"
```
