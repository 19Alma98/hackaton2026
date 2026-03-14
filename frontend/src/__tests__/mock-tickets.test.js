import { describe, it, expect } from 'vitest'
import { MY_TICKETS, LISTINGS } from '../mock/tickets.js'

const VALID_TICKET_STATUSES = ['owned', 'listed']
const ETHEREUM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

// ─── MY_TICKETS ──────────────────────────────────────────────────────────────

describe('MY_TICKETS mock data', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(MY_TICKETS)).toBe(true)
    expect(MY_TICKETS.length).toBeGreaterThan(0)
  })

  it('every ticket has tokenId, eventId, seat, status, listingPrice', () => {
    const REQUIRED_KEYS = ['tokenId', 'eventId', 'seat', 'status', 'listingPrice']
    for (const ticket of MY_TICKETS) {
      for (const key of REQUIRED_KEYS) {
        expect(ticket, `ticket ${ticket.tokenId} missing "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('every tokenId is a unique string', () => {
    const ids = MY_TICKETS.map(t => t.tokenId)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
    for (const id of ids) {
      expect(typeof id).toBe('string')
    }
  })

  it('every status is one of the valid statuses', () => {
    for (const ticket of MY_TICKETS) {
      expect(VALID_TICKET_STATUSES).toContain(ticket.status)
    }
  })

  it('listed tickets have a non-null listingPrice string', () => {
    for (const ticket of MY_TICKETS) {
      if (ticket.status === 'listed') {
        expect(ticket.listingPrice).not.toBeNull()
        expect(typeof ticket.listingPrice).toBe('string')
        expect(parseFloat(ticket.listingPrice)).toBeGreaterThan(0)
      }
    }
  })

  it('owned tickets have a null listingPrice', () => {
    for (const ticket of MY_TICKETS) {
      if (ticket.status === 'owned') {
        expect(ticket.listingPrice).toBeNull()
      }
    }
  })

  it('every eventId references a known event format (evt-XX)', () => {
    for (const ticket of MY_TICKETS) {
      expect(ticket.eventId).toMatch(/^evt-\d{2}$/)
    }
  })

  it('contains exactly 3 tickets', () => {
    expect(MY_TICKETS).toHaveLength(3)
  })
})

// ─── LISTINGS ────────────────────────────────────────────────────────────────

describe('LISTINGS mock data', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(LISTINGS)).toBe(true)
    expect(LISTINGS.length).toBeGreaterThan(0)
  })

  it('every listing has tokenId, eventId, seat, price, seller', () => {
    const REQUIRED_KEYS = ['tokenId', 'eventId', 'seat', 'price', 'seller']
    for (const listing of LISTINGS) {
      for (const key of REQUIRED_KEYS) {
        expect(listing, `listing tokenId=${listing.tokenId} missing "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('every tokenId is a unique string', () => {
    const ids = LISTINGS.map(l => l.tokenId)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('every price is a string representing a positive number', () => {
    for (const listing of LISTINGS) {
      const price = parseFloat(listing.price)
      expect(isNaN(price), `listing ${listing.tokenId} has non-numeric price`).toBe(false)
      expect(price).toBeGreaterThan(0)
    }
  })

  it('every seller is a valid checksummed Ethereum address', () => {
    for (const listing of LISTINGS) {
      expect(listing.seller).toMatch(ETHEREUM_ADDRESS_REGEX)
    }
  })

  it('every eventId references a known event format (evt-XX)', () => {
    for (const listing of LISTINGS) {
      expect(listing.eventId).toMatch(/^evt-\d{2}$/)
    }
  })

  it('no listing tokenId overlaps with MY_TICKETS tokenIds', () => {
    const myIds = new Set(MY_TICKETS.map(t => t.tokenId))
    for (const listing of LISTINGS) {
      expect(myIds.has(listing.tokenId)).toBe(false)
    }
  })

  it('contains exactly 5 listings', () => {
    expect(LISTINGS).toHaveLength(5)
  })
})
