import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EthBadge } from './EthBadge'

describe('EthBadge', () => {
  it('mostra il valore ETH formattato', () => {
    render(<EthBadge weiValue="1000000000000000000" />)
    expect(screen.getByText(/1 ETH/)).toBeInTheDocument()
  })

  it('converte correttamente wei in ETH', () => {
    render(<EthBadge weiValue="500000000000000000" />)
    expect(screen.getByText(/0\.5 ETH/)).toBeInTheDocument()
  })

  it('size lg applica classi text-2xl font-bold text-white', () => {
    const { container } = render(<EthBadge weiValue="1000000000000000000" size="lg" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('text-2xl')
    expect(el.className).toContain('font-bold')
    expect(el.className).toContain('text-white')
  })

  it('size sm (default) applica classi text-sm text-slate-300', () => {
    const { container } = render(<EthBadge weiValue="1000000000000000000" />)
    const el = container.firstChild as HTMLElement
    expect(el.className).toContain('text-sm')
    expect(el.className).toContain('text-slate-300')
  })
})
