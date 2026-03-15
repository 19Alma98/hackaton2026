import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useMarketplace } from './useMarketplace'

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    get: vi.fn(),
  },
}))

import { axiosInstance } from '@/api/axiosInstance'

const mockListings = [
  { token_id: 1, seller: '0xseller1', price_wei: '500000000000000000' },
  { token_id: 2, seller: '0xseller2', price_wei: '1000000000000000000' },
]

describe('useMarketplace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loading è true inizialmente', () => {
    vi.mocked(axiosInstance.get).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useMarketplace())
    expect(result.current.loading).toBe(true)
  })

  it('loading diventa false dopo success', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockListings })
    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('listings contiene dati dopo fetch success', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockListings })
    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.listings).toEqual(mockListings)
  })

  it('listings è [] dopo error', async () => {
    vi.mocked(axiosInstance.get).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.listings).toEqual([])
  })

  it('error è null dopo success', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockListings })
    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('error contiene messaggio per errore 404', async () => {
    const axiosError = Object.assign(new Error('Not Found'), {
      isAxiosError: true,
      response: { status: 404 },
    })
    vi.mocked(axiosInstance.get).mockRejectedValue(axiosError)
    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
    expect(result.current.error).toContain('404')
  })

  it('refetch riesegue la chiamata', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockListings })
    const { result } = renderHook(() => useMarketplace())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(vi.mocked(axiosInstance.get)).toHaveBeenCalledTimes(1)

    vi.mocked(axiosInstance.get).mockResolvedValue({ data: [] })
    await act(async () => {
      result.current.refetch()
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(vi.mocked(axiosInstance.get)).toHaveBeenCalledTimes(2)
  })
})
