import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('ethers', () => ({
  formatEther: (wei) => String(Number(wei) / 1e18),
}))

const mockGetTicketsForSale = vi.fn()
vi.mock('../generated/tickets/tickets', () => ({
  getTickets: () => ({
    getUserTicketsApiTicketsUserAddressGet: vi.fn(),
    getTicketsForSaleApiTicketsForSaleGet: mockGetTicketsForSale,
  }),
}))

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:8000')
  mockGetTicketsForSale.mockReset()
})

const { useForSaleListings } = await import('./useForSaleListings')

describe('useForSaleListings', () => {
  it('restituisce i listings arricchiti dall\'API', async () => {
    mockGetTicketsForSale.mockResolvedValue([
      { token_id: 17, seller: '0xABC', price_wei: '150000000000000000' },
    ])

    const { result } = renderHook(() => useForSaleListings())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.listings).toHaveLength(1)
    expect(result.current.listings[0].tokenId).toBe('17')
    expect(result.current.listings[0].eventId).toBe('evt-01')
    expect(result.current.error).toBeNull()
  })

  it('restituisce lista vuota e imposta error in caso di errore API', async () => {
    mockGetTicketsForSale.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useForSaleListings())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.listings).toHaveLength(0)
    expect(result.current.error).toBe('network error')
  })
})
