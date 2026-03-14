import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const mockGetUserTickets = vi.fn()
const mockGetForSale = vi.fn()

vi.mock('../generated/tickets/tickets', () => ({
  getTickets: () => ({
    getUserTicketsApiTicketsUserAddressGet: mockGetUserTickets,
    getTicketsForSaleApiTicketsForSaleGet: mockGetForSale,
  }),
}))

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:8000')
  mockGetUserTickets.mockReset()
  mockGetForSale.mockReset()
})

const { useMyTickets } = await import('./useMyTickets')

const ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

describe('useMyTickets', () => {
  it('segna come owned i ticket non in vendita', async () => {
    mockGetUserTickets.mockResolvedValue([{ token_id: 42, owner: ADDRESS }])
    mockGetForSale.mockResolvedValue([])

    const { result } = renderHook(() => useMyTickets(ADDRESS))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.tickets[0].status).toBe('owned')
    expect(result.current.tickets[0].tokenId).toBe('42')
  })

  it('segna come listed i ticket presenti in for-sale', async () => {
    mockGetUserTickets.mockResolvedValue([{ token_id: 87, owner: ADDRESS }])
    mockGetForSale.mockResolvedValue([{ token_id: 87, seller: ADDRESS, price_wei: '110000000000000000' }])

    const { result } = renderHook(() => useMyTickets(ADDRESS))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.tickets[0].status).toBe('listed')
  })

  it('restituisce lista vuota e imposta error se la fetch utente fallisce', async () => {
    mockGetUserTickets.mockRejectedValue(new Error('timeout'))
    mockGetForSale.mockResolvedValue([])

    const { result } = renderHook(() => useMyTickets(ADDRESS))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.tickets).toHaveLength(0)
    expect(result.current.error).toBe('timeout')
  })

  it('mostra i ticket utente anche se la fetch for-sale fallisce (503)', async () => {
    mockGetUserTickets.mockResolvedValue([{ token_id: 42, owner: ADDRESS }])
    mockGetForSale.mockRejectedValue(new Error('Marketplace contract not configured'))

    const { result } = renderHook(() => useMyTickets(ADDRESS))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.tickets).toHaveLength(1)
    expect(result.current.tickets[0].status).toBe('owned')
    expect(result.current.error).toBeNull()
  })
})
