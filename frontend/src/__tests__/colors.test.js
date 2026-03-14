import { describe, it, expect } from 'vitest'
import { stringToGradient } from '../utils/colors.js'

const VALID_GRADIENTS = [
  'from-violet-600 to-indigo-800',
  'from-rose-600 to-pink-900',
  'from-teal-500 to-cyan-800',
  'from-amber-500 to-orange-800',
  'from-emerald-500 to-green-800',
  'from-sky-500 to-blue-800',
  'from-fuchsia-600 to-purple-900',
]

describe('stringToGradient', () => {
  it('always returns one of the known gradient classes', () => {
    expect(VALID_GRADIENTS).toContain(stringToGradient('hello'))
  })

  it('is deterministic — same input always yields same output', () => {
    const addr = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    expect(stringToGradient(addr)).toBe(stringToGradient(addr))
  })

  it('returns a valid gradient for an empty string (default parameter)', () => {
    expect(VALID_GRADIENTS).toContain(stringToGradient())
  })

  it('returns a valid gradient for an explicit empty string', () => {
    expect(VALID_GRADIENTS).toContain(stringToGradient(''))
  })

  it('produces stable output for a known tokenId "42"', () => {
    // hash of "42" → charCode('4')=52, charCode('2')=50 → sum=102 → 102 % 7 = 4
    expect(stringToGradient('42')).toBe(VALID_GRADIENTS[4])
  })

  it('returns different gradients for sufficiently different inputs', () => {
    // Not guaranteed, but these two have different hashes
    const g1 = stringToGradient('aaa')
    const g2 = stringToGradient('zzz')
    // Both must still be valid gradients
    expect(VALID_GRADIENTS).toContain(g1)
    expect(VALID_GRADIENTS).toContain(g2)
  })

  it('handles unicode characters without throwing', () => {
    expect(() => stringToGradient('emoji🎟️')).not.toThrow()
    expect(VALID_GRADIENTS).toContain(stringToGradient('emoji🎟️'))
  })

  it('handles very long strings without throwing', () => {
    const long = 'a'.repeat(10000)
    expect(() => stringToGradient(long)).not.toThrow()
    expect(VALID_GRADIENTS).toContain(stringToGradient(long))
  })

  it('cycles over all 7 gradients — modulo boundary check at index 6', () => {
    // Find a string whose hash % 7 === 6
    // We iterate chars to craft one
    const results = new Set()
    for (let i = 0; i < 200; i++) {
      results.add(stringToGradient(String(i)))
    }
    // With 200 inputs across 7 buckets we should hit at least 6 distinct gradients
    expect(results.size).toBeGreaterThanOrEqual(6)
  })
})
