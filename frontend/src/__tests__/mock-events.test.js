import { describe, it, expect } from 'vitest'
import { EVENTS } from '../mock/events.js'

const REQUIRED_KEYS = ['id', 'name', 'date', 'venue', 'description', 'gradient', 'minPrice', 'availableTickets']

describe('EVENTS mock data', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(EVENTS)).toBe(true)
    expect(EVENTS.length).toBeGreaterThan(0)
  })

  it('every event has all required fields', () => {
    for (const event of EVENTS) {
      for (const key of REQUIRED_KEYS) {
        expect(event, `event ${event.id} is missing field "${key}"`).toHaveProperty(key)
      }
    }
  })

  it('every event id is a non-empty string', () => {
    for (const event of EVENTS) {
      expect(typeof event.id).toBe('string')
      expect(event.id.length).toBeGreaterThan(0)
    }
  })

  it('every event id is unique', () => {
    const ids = EVENTS.map(e => e.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('every event date is a valid ISO date string', () => {
    for (const event of EVENTS) {
      const d = new Date(event.date)
      expect(isNaN(d.getTime()), `event ${event.id} has invalid date "${event.date}"`).toBe(false)
    }
  })

  it('every event minPrice is a string representing a positive number', () => {
    for (const event of EVENTS) {
      const price = parseFloat(event.minPrice)
      expect(isNaN(price), `event ${event.id} has non-numeric minPrice`).toBe(false)
      expect(price).toBeGreaterThan(0)
    }
  })

  it('every event availableTickets is a non-negative integer', () => {
    for (const event of EVENTS) {
      expect(Number.isInteger(event.availableTickets)).toBe(true)
      expect(event.availableTickets).toBeGreaterThanOrEqual(0)
    }
  })

  it('every event gradient is a non-empty string', () => {
    for (const event of EVENTS) {
      expect(typeof event.gradient).toBe('string')
      expect(event.gradient.length).toBeGreaterThan(0)
    }
  })

  it('every event name and venue are non-empty strings', () => {
    for (const event of EVENTS) {
      expect(typeof event.name).toBe('string')
      expect(event.name.length).toBeGreaterThan(0)
      expect(typeof event.venue).toBe('string')
      expect(event.venue.length).toBeGreaterThan(0)
    }
  })

  it('contains exactly 5 events', () => {
    expect(EVENTS).toHaveLength(5)
  })
})
