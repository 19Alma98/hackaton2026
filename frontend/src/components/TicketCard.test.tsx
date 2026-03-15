import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TicketCard } from './TicketCard'
import type { TokenBalance } from '@/types/api'

const mockToken: TokenBalance = {
  contract_address: '0xcontract',
  name: 'MultiRealBitcoin Concert',
  symbol: 'MPC',
  balance: 3,
  token_ids: [101, 102, 103],
}

describe('TicketCard', () => {
  it('mostra il nome del token trasformato da changeStringMultiRealBitcoin', () => {
    render(<TicketCard tokenBalance={mockToken} onTokenClick={vi.fn()} />)
    expect(screen.getByText('MyRealBigliettoh')).toBeInTheDocument()
  })

  it('click su un token_id chiama onTokenClick con id corretto', () => {
    const onTokenClick = vi.fn()
    render(<TicketCard tokenBalance={mockToken} onTokenClick={onTokenClick} />)
    fireEvent.click(screen.getByText('#101'))
    expect(onTokenClick).toHaveBeenCalledWith(101)
  })

  it('mostra il balance del token', () => {
    render(<TicketCard tokenBalance={mockToken} onTokenClick={vi.fn()} />)
    expect(screen.getByText(/3 biglietti/)).toBeInTheDocument()
  })

  it('gestisce token_ids null/empty mostrando solo il conteggio', () => {
    const tokenWithNoIds: TokenBalance = { ...mockToken, token_ids: [], balance: 2 }
    render(<TicketCard tokenBalance={tokenWithNoIds} onTokenClick={vi.fn()} />)
    expect(screen.getByText(/2 biglietti/)).toBeInTheDocument()
    expect(screen.queryByText('#101')).not.toBeInTheDocument()
  })
})
