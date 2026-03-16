import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarketplaceGrid } from './MarketplaceGrid'
import type { ListingInfo } from '@/types/api'

const mockListings: ListingInfo[] = [
  { token_id: 1, seller: '0xseller0000000000000000000000000000000001', price_wei: '500000000000000000' },
  { token_id: 2, seller: '0xseller0000000000000000000000000000000002', price_wei: '1000000000000000000' },
]

const currentAddress = '0xcurrent000000000000000000000000000000001'

describe('MarketplaceGrid', () => {
  it('mostra skeleton durante loading', () => {
    const { container } = render(
      <MarketplaceGrid
        listings={[]}
        loading={true}
        error={null}
        currentAddress={currentAddress}
        onBuy={vi.fn()}
      />
    )
    // 4 skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(4)
  })

  it('mostra messaggio di errore', () => {
    render(
      <MarketplaceGrid
        listings={[]}
        loading={false}
        error="Errore di connessione"
        currentAddress={currentAddress}
        onBuy={vi.fn()}
      />
    )
    expect(screen.getByText(/Errore di connessione/)).toBeInTheDocument()
  })

  it('mostra empty state quando listings è vuoto', () => {
    render(
      <MarketplaceGrid
        listings={[]}
        loading={false}
        error={null}
        currentAddress={currentAddress}
        onBuy={vi.fn()}
      />
    )
    expect(screen.getByText(/Nessun biglietto in vendita/i)).toBeInTheDocument()
  })

  it('renderizza ListingCard per ogni listing', () => {
    render(
      <MarketplaceGrid
        listings={mockListings}
        loading={false}
        error={null}
        currentAddress={currentAddress}
        onBuy={vi.fn()}
      />
    )
    expect(screen.getByText(/#1/)).toBeInTheDocument()
    expect(screen.getByText(/#2/)).toBeInTheDocument()
  })

  it('passa isMine=true quando seller corrisponde a currentAddress (case-insensitive)', () => {
    const listingsWithMine: ListingInfo[] = [
      { token_id: 5, seller: currentAddress.toUpperCase(), price_wei: '1000000000000000000' },
    ]
    render(
      <MarketplaceGrid
        listings={listingsWithMine}
        loading={false}
        error={null}
        currentAddress={currentAddress}
        onBuy={vi.fn()}
      />
    )
    expect(screen.getByText(/Il tuo biglietto/i)).toBeInTheDocument()
  })
})
