import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WalletPanel } from './WalletPanel'
import type { WalletInfo } from '@/types/api'

const mockWallet: WalletInfo = {
  name: 'Alice',
  address: '0xalice1234567890abcdef1234567890abcdef12',
  balance_wei: '2000000000000000000',
  balance_eth: 2.0,
  nonce: 5,
  tokens: [
    {
      contract_address: '0xcontract',
      name: 'MultiRealBitcoin Festival',
      symbol: 'MPF',
      balance: 2,
      token_ids: [10, 11],
    },
  ],
}

describe('WalletPanel', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('mostra il nome utente', () => {
    render(<WalletPanel wallet={mockWallet} onTokenClick={vi.fn()} onSell={vi.fn()} onLogout={vi.fn()} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('mostra indirizzo troncato via AddressChip', () => {
    render(<WalletPanel wallet={mockWallet} onTokenClick={vi.fn()} onSell={vi.fn()} onLogout={vi.fn()} />)
    expect(screen.getByText('0xalic...ef12')).toBeInTheDocument()
  })

  it('mostra il balance ETH', () => {
    render(<WalletPanel wallet={mockWallet} onTokenClick={vi.fn()} onSell={vi.fn()} onLogout={vi.fn()} />)
    expect(screen.getByText(/2 ETH/)).toBeInTheDocument()
  })

  it('mostra TicketCard per ogni token', () => {
    render(<WalletPanel wallet={mockWallet} onTokenClick={vi.fn()} onSell={vi.fn()} onLogout={vi.fn()} />)
    expect(screen.getByText('MyRealBigliettoh')).toBeInTheDocument()
  })

  it('empty state quando tokens è vuoto', () => {
    const walletNoTokens: WalletInfo = { ...mockWallet, tokens: [] }
    render(<WalletPanel wallet={walletNoTokens} onTokenClick={vi.fn()} onSell={vi.fn()} onLogout={vi.fn()} />)
    expect(screen.getByText(/Nessun biglietto ancora/i)).toBeInTheDocument()
  })

  it('click su ticket chiama onTokenClick con id corretto', () => {
    const onTokenClick = vi.fn()
    render(<WalletPanel wallet={mockWallet} onTokenClick={onTokenClick} onSell={vi.fn()} onLogout={vi.fn()} />)
    fireEvent.click(screen.getByText('#10'))
    expect(onTokenClick).toHaveBeenCalledWith(10)
  })

  it('click su "Cambia identità" chiama onLogout', () => {
    const onLogout = vi.fn()
    render(<WalletPanel wallet={mockWallet} onTokenClick={vi.fn()} onSell={vi.fn()} onLogout={onLogout} />)
    fireEvent.click(screen.getByRole('button', { name: /Cambia identità/i }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('click su Vendi chiama onSell con tokenId corretto', () => {
    const onSell = vi.fn()
    render(<WalletPanel wallet={mockWallet} onTokenClick={vi.fn()} onSell={onSell} onLogout={vi.fn()} />)
    const vendiButtons = screen.getAllByRole('button', { name: /Vendi/i })
    fireEvent.click(vendiButtons[0])
    expect(onSell).toHaveBeenCalledWith(10)
  })
})
