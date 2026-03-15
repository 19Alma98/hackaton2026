import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    post: vi.fn(),
  },
}))

import { axiosInstance } from '@/api/axiosInstance'
import { useListTicket } from './useListTicket'
import type { TxResult } from '@/types/api'

const OWNER = '0xowner0000000000000000000000000000000001'
const MARKETPLACE = '0xmarket0000000000000000000000000000000001'

const successTx: TxResult = {
  tx_hash: '0xhash',
  status: 'success',
  block_number: 100,
  gas_used: 50000,
  from_address: OWNER,
  to_address: MARKETPLACE,
  value_wei: null,
  error: null,
}

const failedTx: TxResult = {
  tx_hash: null,
  status: 'failed',
  block_number: null,
  gas_used: null,
  from_address: null,
  to_address: null,
  value_wei: null,
  error: 'Transazione fallita',
}

describe('useListTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stato iniziale: idle, tutto null', () => {
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.tokenId).toBeNull()
    expect(result.current.state.priceWei).toBeNull()
    expect(result.current.state.approveTxResult).toBeNull()
    expect(result.current.state.listTxResult).toBeNull()
    expect(result.current.state.error).toBeNull()
  })

  it('startList(42) → status: price-input, tokenId: 42', () => {
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    expect(result.current.state.status).toBe('price-input')
    expect(result.current.state.tokenId).toBe(42)
  })

  it('setPrice salva priceWei mantenendo status price-input', () => {
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    act(() => { result.current.setPrice('1000000000000000000') })
    expect(result.current.state.priceWei).toBe('1000000000000000000')
    expect(result.current.state.status).toBe('price-input')
  })

  it('cancel() torna a idle', () => {
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    act(() => { result.current.cancel() })
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.tokenId).toBeNull()
  })

  it('confirmList() cambia a approving', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: successTx })
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    act(() => { result.current.setPrice('1000000000000000000') })
    let promise: Promise<void>
    act(() => { promise = result.current.confirmList() })
    // immediately after calling, should be approving
    expect(result.current.state.status).toBe('approving')
    await act(async () => { await promise })
  })

  it('dopo approve success, cambia a listing poi success', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: successTx })
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    act(() => { result.current.setPrice('1000000000000000000') })
    await act(async () => { await result.current.confirmList() })
    expect(result.current.state.status).toBe('success')
  })

  it('dopo list success, status: success, entrambi i txResult presenti', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: successTx })
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    act(() => { result.current.setPrice('1000000000000000000') })
    await act(async () => { await result.current.confirmList() })
    expect(result.current.state.approveTxResult).toEqual(successTx)
    expect(result.current.state.listTxResult).toEqual(successTx)
  })

  it('se approve risponde con status failed → status error con messaggio', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: failedTx })
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    act(() => { result.current.setPrice('1000000000000000000') })
    await act(async () => { await result.current.confirmList() })
    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBe('Transazione fallita')
  })

  it('se list risponde con status failed → status error', async () => {
    vi.mocked(axiosInstance.post)
      .mockResolvedValueOnce({ data: successTx })
      .mockResolvedValueOnce({ data: failedTx })
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    act(() => { result.current.setPrice('1000000000000000000') })
    await act(async () => { await result.current.confirmList() })
    expect(result.current.state.status).toBe('error')
  })

  it('se network error in approve → status error', async () => {
    vi.mocked(axiosInstance.post).mockRejectedValue(new Error('Network Error'))
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    act(() => { result.current.setPrice('1000000000000000000') })
    await act(async () => { await result.current.confirmList() })
    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBeTruthy()
  })

  it('reset() torna a idle e pulisce tutto', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: successTx })
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    act(() => { result.current.setPrice('1000000000000000000') })
    await act(async () => { await result.current.confirmList() })
    act(() => { result.current.reset() })
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.tokenId).toBeNull()
    expect(result.current.state.priceWei).toBeNull()
  })

  it('confirmList() non fa nulla se status non è price-input', async () => {
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    // idle status — should not call API
    await act(async () => { await result.current.confirmList() })
    expect(axiosInstance.post).not.toHaveBeenCalled()
  })

  it('confirmList() non fa nulla se priceWei è null', async () => {
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    // priceWei not set
    await act(async () => { await result.current.confirmList() })
    expect(axiosInstance.post).not.toHaveBeenCalled()
  })

  it('body approve contiene owner_address, approved_address, token_id, wait_for_receipt', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: successTx })
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    act(() => { result.current.setPrice('1000000000000000000') })
    await act(async () => { await result.current.confirmList() })
    expect(vi.mocked(axiosInstance.post)).toHaveBeenNthCalledWith(
      1,
      '/api/transfers/nft/approve',
      {
        owner_address: OWNER,
        approved_address: MARKETPLACE,
        token_id: 42,
        wait_for_receipt: true,
      }
    )
  })

  it('body list contiene seller_address, token_id, price_wei, wait_for_receipt', async () => {
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: successTx })
    const { result } = renderHook(() => useListTicket(OWNER, MARKETPLACE))
    act(() => { result.current.startList(42) })
    act(() => { result.current.setPrice('1000000000000000000') })
    await act(async () => { await result.current.confirmList() })
    expect(vi.mocked(axiosInstance.post)).toHaveBeenNthCalledWith(
      2,
      '/api/marketplace/list',
      {
        seller_address: OWNER,
        token_id: 42,
        price_wei: '1000000000000000000',
        wait_for_receipt: true,
      }
    )
  })
})
