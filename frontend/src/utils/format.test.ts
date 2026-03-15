import { describe, it, expect } from 'vitest'
import { shortAddress, formatEth } from './format'

describe('shortAddress', () => {
  it('tronca un indirizzo completo nel formato 0x1234...5678', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678'
    expect(shortAddress(address)).toBe('0x1234...5678')
  })

  it('non crasha con stringa vuota', () => {
    expect(shortAddress('')).toBe('')
  })

  it('restituisce as-is se < 10 caratteri', () => {
    expect(shortAddress('0x1234')).toBe('0x1234')
  })

  it('tronca mantenendo i primi 6 e gli ultimi 4 caratteri', () => {
    const address = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    expect(shortAddress(address)).toBe('0xabcd...abcd')
  })
})

describe('formatEth', () => {
  it('converte 1 ETH correttamente', () => {
    expect(formatEth('1000000000000000000')).toBe('1.0 ETH')
  })

  it('gestisce 0 wei', () => {
    expect(formatEth('0')).toBe('0.0 ETH')
  })

  it('gestisce 0.5 ETH', () => {
    expect(formatEth('500000000000000000')).toBe('0.5 ETH')
  })

  it('non crasha con input non valido', () => {
    expect(formatEth('invalid')).toBe('0 ETH')
  })
})
