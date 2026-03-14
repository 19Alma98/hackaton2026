import { describe, it, expect, vi } from 'vitest'

vi.mock('ethers', () => ({
  formatEther: (wei) => String(Number(wei) / 1e18),
}))

const { enrichListings } = await import('./enrichListings')

describe('enrichListings', () => {
  it('arricchisce con seat e eventId quando il token è nel mock', () => {
    const apiListings = [{ token_id: 17, seller: '0xABC', price_wei: '150000000000000000' }]
    const result = enrichListings(apiListings)
    expect(result).toHaveLength(1)
    expect(result[0].tokenId).toBe('17')
    expect(result[0].eventId).toBe('evt-01')
    expect(result[0].seat).toBe('Tribuna Ovest – Fila 12 – Posto 31')
    expect(result[0].seller).toBe('0xABC')
    expect(result[0].priceWei).toBe('150000000000000000')
    expect(result[0].price).toContain('ETH')
  })

  it('usa fallback quando il token NON è nel mock', () => {
    const apiListings = [{ token_id: 999, seller: '0xDEF', price_wei: '50000000000000000' }]
    const result = enrichListings(apiListings)
    expect(result[0].tokenId).toBe('999')
    expect(result[0].eventId).toBeNull()
    expect(result[0].seat).toBe('Posto #999')
  })

  it('gestisce un array vuoto', () => {
    expect(enrichListings([])).toEqual([])
  })
})
