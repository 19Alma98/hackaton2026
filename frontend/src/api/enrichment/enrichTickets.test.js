import { describe, it, expect } from 'vitest'
import { enrichTickets } from './enrichTickets'

describe('enrichTickets', () => {
  it('segna come owned un ticket non in vendita', () => {
    const apiTickets = [{ token_id: 42, owner: '0xABC' }]
    const forSale = new Set()
    const result = enrichTickets(apiTickets, forSale)
    expect(result[0].status).toBe('owned')
    expect(result[0].tokenId).toBe('42')
    expect(result[0].eventId).toBe('evt-01')
    expect(result[0].seat).toBe('Curva Nord – Settore 14 – Fila 8 – Posto 22')
  })

  it('segna come listed un ticket presente nel set forSale', () => {
    const apiTickets = [{ token_id: 87, owner: '0xABC' }]
    const forSale = new Set(['87'])
    const result = enrichTickets(apiTickets, forSale)
    expect(result[0].status).toBe('listed')
  })

  it('usa fallback per ticket non nel mock', () => {
    const apiTickets = [{ token_id: 999, owner: '0xABC' }]
    const forSale = new Set()
    const result = enrichTickets(apiTickets, forSale)
    expect(result[0].eventId).toBeNull()
    expect(result[0].seat).toBe('Posto #999')
    expect(result[0].listingPrice).toBeNull()
  })

  it('gestisce un array vuoto', () => {
    expect(enrichTickets([], new Set())).toEqual([])
  })
})
