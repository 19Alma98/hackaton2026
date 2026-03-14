import { describe, it, expect } from 'vitest'
import { shortAddress, formatEventDate, formatEth } from '../utils/format.js'

// ─── shortAddress ────────────────────────────────────────────────────────────

describe('shortAddress', () => {
  it('truncates a full Ethereum address to first 6 + last 4 chars', () => {
    const addr = '0x1234567890abcdef1234567890abcdef12345678'
    expect(shortAddress(addr)).toBe('0x1234...5678')
  })

  it('returns empty string for null', () => {
    expect(shortAddress(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(shortAddress(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(shortAddress('')).toBe('')
  })

  it('handles a short string without crashing (slice still works)', () => {
    // slice(0,6) and slice(-4) on "0xABC" → "0xABC" + "..." + "xABC"
    const result = shortAddress('0xABC')
    expect(result).toContain('...')
  })

  it('preserves the separator format "..."', () => {
    expect(shortAddress('0xDeAdBeEf0000000000000000000000000000cafe')).toMatch(/^.{6}\.{3}.{4}$/)
  })

  it('uses exactly 6 leading chars and 4 trailing chars', () => {
    const addr = '0xAABBCCDDEEFF00112233445566778899AABBCCDD'
    const result = shortAddress(addr)
    expect(result.startsWith(addr.slice(0, 6))).toBe(true)
    expect(result.endsWith(addr.slice(-4))).toBe(true)
  })
})

// ─── formatEventDate ─────────────────────────────────────────────────────────

describe('formatEventDate', () => {
  it('returns a string containing the separator "·"', () => {
    expect(formatEventDate('2026-04-12T20:45:00')).toContain('·')
  })

  it('contains the hour and minute formatted as HH:MM', () => {
    const result = formatEventDate('2026-04-12T20:45:00')
    expect(result).toContain('20:45')
  })

  it('returns a non-empty string for a valid ISO date', () => {
    expect(formatEventDate('2026-09-06T15:00:00').length).toBeGreaterThan(0)
  })

  it('handles midnight correctly', () => {
    const result = formatEventDate('2026-01-01T00:00:00')
    expect(result).toContain('00:00')
  })

  it('produces different output for different dates', () => {
    const a = formatEventDate('2026-04-12T20:45:00')
    const b = formatEventDate('2026-09-06T15:00:00')
    expect(a).not.toBe(b)
  })
})

// ─── formatEth ───────────────────────────────────────────────────────────────

describe('formatEth', () => {
  it('appends " ETH" to a numeric string', () => {
    expect(formatEth('0.12')).toBe('0.12 ETH')
  })

  it('appends " ETH" to an integer string', () => {
    expect(formatEth('1')).toBe('1 ETH')
  })

  it('appends " ETH" to a number value', () => {
    expect(formatEth(0.5)).toBe('0.5 ETH')
  })

  it('appends " ETH" to zero', () => {
    expect(formatEth(0)).toBe('0 ETH')
  })

  it('handles large numbers', () => {
    expect(formatEth('9999.9999')).toBe('9999.9999 ETH')
  })

  it('handles string "0"', () => {
    expect(formatEth('0')).toBe('0 ETH')
  })
})
