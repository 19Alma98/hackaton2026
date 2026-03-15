import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BuyConfirmSheet } from './BuyConfirmSheet'
import type { ListingInfo } from '@/types/api'

const mockListing: ListingInfo = {
  token_id: 42,
  seller: '0xseller1234567890abcdef1234567890abcdef12',
  price_wei: '1000000000000000000',
}

const buyerAddress = '0xbuyer1234567890abcdef1234567890abcdef12'

describe('BuyConfirmSheet', () => {
  it('mostra il token_id', () => {
    render(
      <BuyConfirmSheet
        listing={mockListing}
        buyerAddress={buyerAddress}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText(/#42/)).toBeInTheDocument()
  })

  it('mostra il prezzo in ETH', () => {
    render(
      <BuyConfirmSheet
        listing={mockListing}
        buyerAddress={buyerAddress}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText(/1\.0 ETH/)).toBeInTheDocument()
  })

  it('mostra il seller troncato', () => {
    render(
      <BuyConfirmSheet
        listing={mockListing}
        buyerAddress={buyerAddress}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText('0xsell...ef12')).toBeInTheDocument()
  })

  it('mostra il buyer troncato', () => {
    render(
      <BuyConfirmSheet
        listing={mockListing}
        buyerAddress={buyerAddress}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText('0xbuye...ef12')).toBeInTheDocument()
  })

  it('click Conferma chiama onConfirm', () => {
    const onConfirm = vi.fn()
    render(
      <BuyConfirmSheet
        listing={mockListing}
        buyerAddress={buyerAddress}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Conferma/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('click Annulla chiama onCancel', () => {
    const onCancel = vi.fn()
    render(
      <BuyConfirmSheet
        listing={mockListing}
        buyerAddress={buyerAddress}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Annulla/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
