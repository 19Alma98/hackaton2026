import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ListingCard } from './ListingCard'
import type { ListingInfo } from '@/types/api'

const mockListing: ListingInfo = {
  token_id: 7,
  seller: '0xseller1234567890abcdef1234567890abcdef12',
  price_wei: '500000000000000000',
}

describe('ListingCard', () => {
  it('mostra il token_id', () => {
    render(<ListingCard listing={mockListing} onBuy={vi.fn()} isMine={false} />)
    expect(screen.getByText(/#7/)).toBeInTheDocument()
  })

  it('mostra il seller troncato', () => {
    render(<ListingCard listing={mockListing} onBuy={vi.fn()} isMine={false} />)
    expect(screen.getByText('0xsell...ef12')).toBeInTheDocument()
  })

  it('mostra il prezzo in ETH', () => {
    render(<ListingCard listing={mockListing} onBuy={vi.fn()} isMine={false} />)
    expect(screen.getByText(/0\.5 ETH/)).toBeInTheDocument()
  })

  it('click su Acquista chiama onBuy', () => {
    const onBuy = vi.fn()
    render(<ListingCard listing={mockListing} onBuy={onBuy} isMine={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Acquista/i }))
    expect(onBuy).toHaveBeenCalledTimes(1)
  })

  it('isMine=true disabilita il pulsante', () => {
    render(<ListingCard listing={mockListing} onBuy={vi.fn()} isMine={true} />)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('isMine=true mostra testo "Il tuo biglietto"', () => {
    render(<ListingCard listing={mockListing} onBuy={vi.fn()} isMine={true} />)
    expect(screen.getByText(/Il tuo biglietto/i)).toBeInTheDocument()
  })
})
