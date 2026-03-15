import { useState, useCallback, useRef } from 'react'
import { axiosInstance } from '@/api/axiosInstance'
import type { TxResult } from '@/types/api'

export type ListStatus = 'idle' | 'price-input' | 'approving' | 'listing' | 'success' | 'error'

export interface ListState {
  status: ListStatus
  tokenId: number | null
  priceWei: string | null
  approveTxResult: TxResult | null
  listTxResult: TxResult | null
  error: string | null
}

const INITIAL_STATE: ListState = {
  status: 'idle',
  tokenId: null,
  priceWei: null,
  approveTxResult: null,
  listTxResult: null,
  error: null,
}

interface UseListTicketResult {
  state: ListState
  startList: (tokenId: number) => void
  setPrice: (priceWei: string) => void
  confirmList: () => Promise<void>
  cancel: () => void
  reset: () => void
}

export function useListTicket(ownerAddress: string, marketplaceAddress: string): UseListTicketResult {
  const [state, setState] = useState<ListState>(INITIAL_STATE)
  const stateRef = useRef<ListState>(INITIAL_STATE)

  const updateState = useCallback((next: ListState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const startList = useCallback((tokenId: number) => {
    updateState({ ...INITIAL_STATE, status: 'price-input', tokenId })
  }, [updateState])

  const setPrice = useCallback((priceWei: string) => {
    const current = stateRef.current
    updateState({ ...current, priceWei })
  }, [updateState])

  const cancel = useCallback(() => {
    updateState({ ...INITIAL_STATE })
  }, [updateState])

  const reset = useCallback(() => {
    updateState({ ...INITIAL_STATE })
  }, [updateState])

  const confirmList = useCallback(async () => {
    const current = stateRef.current
    if (current.status !== 'price-input') return
    if (current.priceWei === null) return

    const { tokenId, priceWei } = current

    updateState({ ...current, status: 'approving', error: null })

    try {
      const approveRes = await axiosInstance.post<TxResult>('/api/transfers/nft/approve', {
        owner_address: ownerAddress,
        approved_address: marketplaceAddress,
        token_id: tokenId,
        wait_for_receipt: true,
      })

      const approveTxResult = approveRes.data

      if (approveTxResult.status !== 'success') {
        updateState({
          ...stateRef.current,
          status: 'error',
          approveTxResult,
          error: approveTxResult.error ?? 'Approvazione non riuscita',
        })
        return
      }

      updateState({ ...stateRef.current, status: 'listing', approveTxResult })

      const listRes = await axiosInstance.post<TxResult>('/api/marketplace/list', {
        seller_address: ownerAddress,
        token_id: tokenId,
        price_wei: priceWei,
        wait_for_receipt: true,
      })

      const listTxResult = listRes.data

      if (listTxResult.status === 'success') {
        updateState({
          ...stateRef.current,
          status: 'success',
          listTxResult,
        })
      } else {
        updateState({
          ...stateRef.current,
          status: 'error',
          listTxResult,
          error: listTxResult.error ?? 'Listing non riuscito',
        })
      }
    } catch {
      updateState({
        ...stateRef.current,
        status: 'error',
        error: "Errore di rete. Impossibile completare il listing.",
      })
    }
  }, [ownerAddress, marketplaceAddress, updateState])

  return { state, startList, setPrice, confirmList, cancel, reset }
}
