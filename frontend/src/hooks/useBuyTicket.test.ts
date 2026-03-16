import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBuyTicket } from './useBuyTicket'
import type { ListingInfo } from '@/types/api'

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    post: vi.fn(),
  },
}))

import { axiosInstance } from '@/api/axiosInstance'

const mockListing: ListingInfo = {
  token_id: 42,
  seller: '0xseller000000000000000000000000000000001',
  price_wei: '500000000000000000',
}

const buyerAddress = '0xbuyer0000000000000000000000000000000001'

describe('useBuyTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stato iniziale è idle con listing/txResult/error null', () => {
    const { result } = renderHook(() => useBuyTicket(buyerAddress))
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.listing).toBeNull()
    expect(result.current.state.txResult).toBeNull()
    expect(result.current.state.error).toBeNull()
  })

  it('startBuy cambia status a confirming e salva listing', () => {
    const { result } = renderHook(() => useBuyTicket(buyerAddress))
    act(() => {
      result.current.startBuy(mockListing)
    })
    expect(result.current.state.status).toBe('confirming')
    expect(result.current.state.listing).toEqual(mockListing)
  })

  it('cancelBuy torna a idle e pulisce lo stato', () => {
    const { result } = renderHook(() => useBuyTicket(buyerAddress))
    act(() => {
      result.current.startBuy(mockListing)
    })
    act(() => {
      result.current.cancelBuy()
    })
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.listing).toBeNull()
  })

  it('confirmBuy cambia status a pending', async () => {
    vi.mocked(axiosInstance.post).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useBuyTicket(buyerAddress))
    act(() => {
      result.current.startBuy(mockListing)
    })
    act(() => {
      void result.current.confirmBuy()
    })
    expect(result.current.state.status).toBe('pending')
  })

  it('confirmBuy success → stato success con txResult', async () => {
    const txResult = {
      tx_hash: '0xhash',
      status: 'success',
      block_number: 100,
      gas_used: 50000,
      from_address: buyerAddress,
      to_address: mockListing.seller,
      value_wei: mockListing.price_wei,
      error: null,
    }
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: txResult })
    const { result } = renderHook(() => useBuyTicket(buyerAddress))
    act(() => {
      result.current.startBuy(mockListing)
    })
    await act(async () => {
      await result.current.confirmBuy()
    })
    expect(result.current.state.status).toBe('success')
    expect(result.current.state.txResult).toEqual(txResult)
    expect(result.current.state.error).toBeNull()
  })

  it('confirmBuy con txResult.status="failed" → stato error', async () => {
    const txResult = {
      tx_hash: '0xhash',
      status: 'failed',
      block_number: null,
      gas_used: null,
      from_address: buyerAddress,
      to_address: null,
      value_wei: null,
      error: 'Transazione revertita',
    }
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: txResult })
    const { result } = renderHook(() => useBuyTicket(buyerAddress))
    act(() => {
      result.current.startBuy(mockListing)
    })
    await act(async () => {
      await result.current.confirmBuy()
    })
    expect(result.current.state.status).toBe('error')
    expect(result.current.state.txResult).toEqual(txResult)
    expect(result.current.state.error).toBe('Transazione revertita')
  })

  it('confirmBuy network error → stato error con messaggio generico', async () => {
    vi.mocked(axiosInstance.post).mockRejectedValue(new Error('Network Error'))
    const { result } = renderHook(() => useBuyTicket(buyerAddress))
    act(() => {
      result.current.startBuy(mockListing)
    })
    await act(async () => {
      await result.current.confirmBuy()
    })
    expect(result.current.state.status).toBe('error')
    expect(result.current.state.error).toBeTruthy()
    expect(typeof result.current.state.error).toBe('string')
  })

  it('reset torna a idle e pulisce tutto', async () => {
    const txResult = {
      tx_hash: '0xhash',
      status: 'success',
      block_number: 100,
      gas_used: 50000,
      from_address: buyerAddress,
      to_address: null,
      value_wei: null,
      error: null,
    }
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: txResult })
    const { result } = renderHook(() => useBuyTicket(buyerAddress))
    act(() => {
      result.current.startBuy(mockListing)
    })
    await act(async () => {
      await result.current.confirmBuy()
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.state.status).toBe('idle')
    expect(result.current.state.listing).toBeNull()
    expect(result.current.state.txResult).toBeNull()
    expect(result.current.state.error).toBeNull()
  })

  it('body POST contiene token_id, buyer_address, value_wei corretti', async () => {
    const txResult = {
      tx_hash: '0xhash', status: 'success', block_number: 1,
      gas_used: 1, from_address: null, to_address: null, value_wei: null, error: null,
    }
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: txResult })
    const { result } = renderHook(() => useBuyTicket(buyerAddress))
    act(() => {
      result.current.startBuy(mockListing)
    })
    await act(async () => {
      await result.current.confirmBuy()
    })
    expect(vi.mocked(axiosInstance.post)).toHaveBeenCalledWith(
      '/api/marketplace/buy',
      {
        token_id: mockListing.token_id,
        buyer_address: buyerAddress,
        value_wei: mockListing.price_wei,
      }
    )
  })

  it('confirmBuy non fa nulla se status !== confirming', async () => {
    const { result } = renderHook(() => useBuyTicket(buyerAddress))
    // status is idle, not confirming
    await act(async () => {
      await result.current.confirmBuy()
    })
    expect(vi.mocked(axiosInstance.post)).not.toHaveBeenCalled()
    expect(result.current.state.status).toBe('idle')
  })
})
