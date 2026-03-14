---
id: 12
title: Orval — generazione client API
status: completed
priority: high
---

# Plan 12 — Orval — generazione client API

## Obiettivo
Installare Orval e configurarlo per generare un client axios tipizzato
dall'OpenAPI del backend FastAPI. Il codice generato finisce in
`src/api/generated/` e non va mai modificato a mano.

## Dipendenze
- Backend FastAPI attivo su `http://localhost:8000`
- `GET http://localhost:8000/openapi.json` accessibile

## Packages da installare

**runtime:**
- `axios@^1.7`

**devDependencies:**
- `orval@^7.3`
- `typescript@^5.7`
- `tsx@^4.19`

## Task

- [x] `npm install axios`
- [x] `npm install -D orval typescript tsx`
- [x] Creare `tsconfig.json` minimale nella root di `frontend/`
- [x] Creare `src/api/axiosInstance.ts` con baseURL da `VITE_API_URL`
- [x] Creare `orval.config.ts` nella root di `frontend/`
- [x] Aggiungere script `"api:generate": "orval --config orval.config.ts"` in `package.json`
- [x] Aggiungere `VITE_API_URL=http://localhost:8000` al file `.env`
- [x] Eseguire `npx tsc --noEmit` — zero errori
- [x] Avviare il backend e verificare che `http://localhost:8000/openapi.json` risponda
- [x] Eseguire `npm run api:generate` — verificare che `src/api/generated/` contenga file `.ts`

## File risultanti

```
frontend/
  tsconfig.json
  orval.config.ts
  src/
    api/
      axiosInstance.ts
      generated/           ← NON modificare a mano
        blocks.ts
        events.ts
        tickets.ts
        wallets.ts
        model/
          ...interfacce TypeScript...
```

## Contenuto file chiave

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": false,
    "skipLibCheck": true,
    "noEmit": true,
    "allowJs": true,
    "resolveJsonModule": true
  },
  "include": ["src", "orval.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### `orval.config.ts`
```typescript
import { defineConfig } from 'orval'

export default defineConfig({
  mintpass: {
    input: {
      target: `${process.env.VITE_API_URL ?? 'http://localhost:8000'}/openapi.json`,
    },
    output: {
      mode: 'tags-split',
      target: 'src/api/generated',
      client: 'axios',
      clean: true,
      override: {
        mutator: {
          path: 'src/api/axiosInstance.ts',
          name: 'axiosInstance',
        },
      },
    },
  },
})
```

### `src/api/axiosInstance.ts`
```typescript
import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  timeout: 10000,
})

export default axiosInstance
```

## Backend API — Endpoint disponibili

Base URL: `http://localhost:8000` (via `VITE_API_URL`)
OpenAPI spec: `http://localhost:8000/openapi.json`
Swagger UI: `http://localhost:8000/docs`

| Metodo | Path | Response |
|--------|------|----------|
| GET | `/api/health` | `{ status, block_number, rpc_url, chain_id }` |
| GET | `/api/config` | `{ chain_id, rpc_url, nft_contract_address, marketplace_contract_address }` |
| GET | `/api/blocks/latest?count=10` | `[BlockInfo]` |
| GET | `/api/events/listed?from_block=0` | `[{ seller, token_id, price_wei, block_number, transaction_hash }]` |
| GET | `/api/events/sold?from_block=0` | `[{ seller, buyer, token_id, price_wei, block_number, transaction_hash }]` |
| GET | `/api/tickets/user/{address}` | `[{ token_id, owner }]` |
| GET | `/api/tickets/for-sale` | `[{ token_id, seller, price_wei }]` |
| GET | `/api/wallets?address=<opt>` | `[{ name, address, balance_wei, balance_eth, nonce }]` |

**Tutti GET, nessuna write operation ancora.**
