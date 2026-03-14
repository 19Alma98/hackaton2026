import { describe, it, expect } from 'vitest'
import { EVENTS, MY_TICKETS, LISTINGS } from '../mock/index.js'

describe('mock/index.js re-exports', () => {
  it('re-exports EVENTS as a non-empty array', () => {
    expect(Array.isArray(EVENTS)).toBe(true)
    expect(EVENTS.length).toBeGreaterThan(0)
  })

  it('re-exports MY_TICKETS as a non-empty array', () => {
    expect(Array.isArray(MY_TICKETS)).toBe(true)
    expect(MY_TICKETS.length).toBeGreaterThan(0)
  })

  it('re-exports LISTINGS as a non-empty array', () => {
    expect(Array.isArray(LISTINGS)).toBe(true)
    expect(LISTINGS.length).toBeGreaterThan(0)
  })

  it('EVENTS items from index match direct import structure', () => {
    for (const event of EVENTS) {
      expect(event).toHaveProperty('id')
      expect(event).toHaveProperty('name')
    }
  })
})
