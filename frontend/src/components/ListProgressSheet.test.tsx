import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ListProgressSheet } from './ListProgressSheet'

describe('ListProgressSheet', () => {
  it('approving: mostra "Approvazione NFT" e spinner animate-spin', () => {
    render(
      <ListProgressSheet
        status="approving"
        approveTxResult={null}
        listTxResult={null}
        errorMessage={null}
      />
    )
    expect(screen.getByText(/Approvazione NFT/i)).toBeInTheDocument()
    const spinners = document.querySelectorAll('.animate-spin')
    expect(spinners.length).toBeGreaterThan(0)
  })

  it('approving: Step 2 non ha spinner', () => {
    render(
      <ListProgressSheet
        status="approving"
        approveTxResult={null}
        listTxResult={null}
        errorMessage={null}
      />
    )
    expect(screen.getByText(/Listing sul Marketplace/i)).toBeInTheDocument()
    // Only one spinner should be present (for step 1)
    const spinners = document.querySelectorAll('.animate-spin')
    expect(spinners.length).toBe(1)
  })

  it('listing: Step 1 mostra segno di completamento (non spinner)', () => {
    render(
      <ListProgressSheet
        status="listing"
        approveTxResult={null}
        listTxResult={null}
        errorMessage={null}
      />
    )
    // Step 1 should have a check mark (✓)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('listing: Step 2 ha spinner', () => {
    render(
      <ListProgressSheet
        status="listing"
        approveTxResult={null}
        listTxResult={null}
        errorMessage={null}
      />
    )
    const spinners = document.querySelectorAll('.animate-spin')
    expect(spinners.length).toBe(1)
  })

  it('success: mostra "Biglietto in vendita!"', () => {
    render(
      <ListProgressSheet
        status="success"
        approveTxResult={null}
        listTxResult={null}
        errorMessage={null}
      />
    )
    expect(screen.getByText(/Biglietto in vendita!/i)).toBeInTheDocument()
  })

  it('error: mostra il messaggio di errore', () => {
    render(
      <ListProgressSheet
        status="error"
        approveTxResult={null}
        listTxResult={null}
        errorMessage="Qualcosa è andato storto"
      />
    )
    expect(screen.getByText(/Qualcosa è andato storto/i)).toBeInTheDocument()
  })
})
