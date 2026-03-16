import { useState, useCallback, useRef } from 'react'
import { axiosInstance } from '@/api/axiosInstance'
import type { ListingInfo, TxResult } from '@/types/api'

export type BuyStatus = 'idle' | 'confirming' | 'pending' | 'success' | 'error'

export interface BuyState {
  status: BuyStatus
  listing: ListingInfo | null
  txResult: TxResult | null
  error: string | null
}

const INITIAL_STATE: BuyState = {
  status: 'idle',
  listing: null,
  txResult: null,
  error: null,
}

interface UseBuyTicketResult {
  state: BuyState
  startBuy: (listing: ListingInfo) => void
  confirmBuy: () => Promise<void>
  cancelBuy: () => void
  reset: () => void
}

export function useBuyTicket(buyerAddress: string): UseBuyTicketResult {
  const [state, setState] = useState<BuyState>(INITIAL_STATE)
  const stateRef = useRef<BuyState>(INITIAL_STATE)

  const updateState = useCallback((next: BuyState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const startBuy = useCallback((listing: ListingInfo) => {
    const next: BuyState = { status: 'confirming', listing, txResult: null, error: null }
    updateState(next)
  }, [updateState])

  const cancelBuy = useCallback(() => {
    updateState(INITIAL_STATE)
  }, [updateState])

  const confirmBuy = useCallback(async () => {
    const current = stateRef.current
    if (current.status !== 'confirming') return

    const listing = current.listing
    if (listing === null) return

    updateState({ status: 'pending', listing, txResult: null, error: null })

    try {
      const response = await axiosInstance.post<TxResult>('/api/marketplace/buy', {
        token_id: listing.token_id,
        buyer_address: buyerAddress,
        value_wei: listing.price_wei,
      })
      const txResult = response.data
      if (txResult.status === 'success') {
        updateState({ status: 'success', listing, txResult, error: null })
      } else {
        updateState({
          status: 'error',
          listing,
          txResult,
          error: txResult.error ?? 'Transazione non riuscita',
        })
      }
    } catch {
      updateState({
        status: 'error',
        listing,
        txResult: null,
        error: "Errore di rete. Impossibile completare l'acquisto.",
      })
    }
  }, [buyerAddress, updateState])

  const reset = useCallback(() => {
    updateState(INITIAL_STATE)
  }, [updateState])

  return { state, startBuy, confirmBuy, cancelBuy, reset }
}
