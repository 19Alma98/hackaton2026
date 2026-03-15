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
    render(<TicketCard tokenBalance={mockToken} onTokenClick={vi.fn()} onSell={vi.fn()} />)
    expect(screen.getByText('MyRealBigliettoh')).toBeInTheDocument()
  })

  it('click su un token_id chiama onTokenClick con id corretto', () => {
    const onTokenClick = vi.fn()
    render(<TicketCard tokenBalance={mockToken} onTokenClick={onTokenClick} onSell={vi.fn()} />)
    fireEvent.click(screen.getByText('#101'))
    expect(onTokenClick).toHaveBeenCalledWith(101)
  })

  it('mostra il balance del token', () => {
    render(<TicketCard tokenBalance={mockToken} onTokenClick={vi.fn()} onSell={vi.fn()} />)
    expect(screen.getByText(/3 biglietti/)).toBeInTheDocument()
  })

  it('gestisce token_ids null/empty mostrando solo il conteggio', () => {
    const tokenWithNoIds: TokenBalance = { ...mockToken, token_ids: [], balance: 2 }
    render(<TicketCard tokenBalance={tokenWithNoIds} onTokenClick={vi.fn()} onSell={vi.fn()} />)
    expect(screen.getByText(/2 biglietti/)).toBeInTheDocument()
    expect(screen.queryByText('#101')).not.toBeInTheDocument()
  })

  it('click su Vendi chiama onSell con tokenId corretto', () => {
    const onSell = vi.fn()
    render(<TicketCard tokenBalance={mockToken} onTokenClick={vi.fn()} onSell={onSell} />)
    const vendiButtons = screen.getAllByRole('button', { name: /Vendi/i })
    fireEvent.click(vendiButtons[0])
    expect(onSell).toHaveBeenCalledWith(101)
  })

  it('bottone Vendi è disabled con label "In vendita" per token già listato', () => {
    render(
      <TicketCard
        tokenBalance={mockToken}
        onTokenClick={vi.fn()}
        onSell={vi.fn()}
        listedTokenIds={[101]}
      />
    )
    const inVenditaBtn = screen.getByRole('button', { name: /In vendita/i })
    expect(inVenditaBtn).toBeDisabled()
  })

  it('bottone Vendi rimane attivo per token non in listing', () => {
    render(
      <TicketCard
        tokenBalance={mockToken}
        onTokenClick={vi.fn()}
        onSell={vi.fn()}
        listedTokenIds={[999]}
      />
    )
    const vendiButtons = screen.getAllByRole('button', { name: /Vendi/i })
    expect(vendiButtons[0]).not.toBeDisabled()
  })
})
