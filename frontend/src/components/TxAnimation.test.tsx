import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TxAnimation } from './TxAnimation'

describe('TxAnimation', () => {
  it('pending mostra testo "Transazione in corso..."', () => {
    render(<TxAnimation status="pending" />)
    expect(screen.getByText(/Transazione in corso/i)).toBeInTheDocument()
  })

  it('pending ha elemento con classe animate-spin', () => {
    const { container } = render(<TxAnimation status="pending" />)
    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('pending con txHash mostra hash troncato', () => {
    render(<TxAnimation status="pending" txHash="0xabcdef1234567890abcdef" />)
    expect(screen.getByText(/0xabcd/)).toBeInTheDocument()
  })

  it('success mostra "Biglietto acquistato!"', () => {
    render(<TxAnimation status="success" />)
    expect(screen.getByText(/Biglietto acquistato!/i)).toBeInTheDocument()
  })

  it('success ha classe glow-success', () => {
    const { container } = render(<TxAnimation status="success" />)
    expect(container.querySelector('.glow-success')).toBeTruthy()
  })

  it('error mostra il messaggio di errore', () => {
    render(<TxAnimation status="error" errorMessage="Transazione revertita" />)
    expect(screen.getByText('Transazione revertita')).toBeInTheDocument()
  })
})
