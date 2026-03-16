// =============================================================
// MintPass API Types — basati su backend-api/app/schemas.py
// =============================================================

// --- Wallets ---

export interface TokenBalance {
  contract_address: string
  name: string
  symbol: string
  balance: number
  token_ids: number[]
}

export interface WalletInfo {
  name: string
  address: string
  balance_wei: string
  balance_eth: number
  nonce: number
  tokens: TokenBalance[]
}

// --- Health / Config ---

export interface HealthResponse {
  status: 'ok' | 'rpc_unreachable'
  block_number: number | null
  rpc_url: string
  chain_id: number
}

export interface AppConfig {
  chain_id: number
  rpc_url: string
  nft_contract_address: string
  marketplace_contract_address: string
}

// --- Tickets ---

export interface TicketInfo {
  token_id: number
  owner: string
}

export interface ListingInfo {
  token_id: number
  seller: string
  price_wei: string
}

// --- Marketplace write ---

// TxResult.status values:
//   "success"   — tx confermata on-chain
//   "failed"    — tx revertita
//   "pending"   — timeout receipt (wait_for_receipt: true, timeout scaduto)
//   "submitted" — inviata ma non attesa (wait_for_receipt: false)
export interface TxResult {
  tx_hash: string | null
  status: 'success' | 'failed' | 'pending' | 'submitted'
  block_number: number | null
  gas_used: number | null
  from_address: string | null
  to_address: string | null
  value_wei: string | null
  error: string | null
}

export interface MarketplaceBuyRequest {
  token_id: number
  buyer_address: string
  value_wei: string
  wait_for_receipt?: boolean
}

export interface NftApproveRequest {
  owner_address: string
  approved_address: string
  token_id: number
  wait_for_receipt?: boolean
}

export interface MarketplaceListRequest {
  seller_address: string
  token_id: number
  price_wei: string
  wait_for_receipt?: boolean
}

// --- Events (per TokenHistoryPage) ---

export interface EventListed {
  seller: string
  token_id: number
  price_wei: string
  block_number: number
  transaction_hash: string
}

export interface EventSold {
  seller: string
  buyer: string
  token_id: number
  price_wei: string
  block_number: number
  transaction_hash: string
}
