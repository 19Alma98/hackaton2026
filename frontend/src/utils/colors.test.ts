import { describe, it, expect } from 'vitest'
import { addressToGradient } from './colors'

const ADDR_A = '0xabcdef1234567890abcdef1234567890abcdef12'
const ADDR_B = '0x1000000000000000000000000000000000000001'

describe('addressToGradient', () => {
  it('restituisce una stringa CSS linear-gradient', () => {
    expect(addressToGradient(ADDR_A)).toMatch(/^linear-gradient/)
  })

  it('è deterministico: stesso indirizzo → stesso output', () => {
    expect(addressToGradient(ADDR_A)).toBe(addressToGradient(ADDR_A))
  })

  it('indirizzi diversi producono gradient diversi', () => {
    expect(addressToGradient(ADDR_A)).not.toBe(addressToGradient(ADDR_B))
  })

  it('contiene due colori hsl', () => {
    const result = addressToGradient(ADDR_A)
    const matches = result.match(/hsl\(/g)
    expect(matches).toHaveLength(2)
  })
})
