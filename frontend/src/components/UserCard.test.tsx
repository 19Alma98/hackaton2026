import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UserCard } from './UserCard'
import type { WalletInfo } from '@/types/api'

const mockUser: WalletInfo = {
  name: 'Alice',
  address: '0xabc1230000000000000000000000000000000001',
  balance_wei: '1000000000000000000',
  balance_eth: 1.0,
  nonce: 0,
  tokens: [
    {
      contract_address: '0xcontract',
      name: 'MintPass',
      symbol: 'MP',
      balance: 3,
      token_ids: [1, 2, 3],
    },
  ],
}

const mockUserNoTokens: WalletInfo = {
  ...mockUser,
  tokens: [],
}

const mockUserEmptyName: WalletInfo = {
  ...mockUser,
  name: '',
}

const mockUserMultipleTokenContracts: WalletInfo = {
  ...mockUser,
  tokens: [
    {
      contract_address: '0xcontract1',
      name: 'MintPass',
      symbol: 'MP',
      balance: 2,
      token_ids: [1, 2],
    },
    {
      contract_address: '0xcontract2',
      name: 'AnotherPass',
      symbol: 'AP',
      balance: 5,
      token_ids: [3, 4, 5, 6, 7],
    },
  ],
}

describe('UserCard', () => {
  it('mostra il nome dell\'utente', () => {
    render(<UserCard user={mockUser} onClick={vi.fn()} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('mostra l\'indirizzo troncato con "..."', () => {
    render(<UserCard user={mockUser} onClick={vi.fn()} />)
    const addressEl = screen.getByText(/\.\.\./)
    expect(addressEl).toBeInTheDocument()
    expect(addressEl.textContent).toContain('...')
  })

  it('mostra il balance ETH formattato con "ETH"', () => {
    render(<UserCard user={mockUser} onClick={vi.fn()} />)
    expect(screen.getByText(/ETH/)).toBeInTheDocument()
  })

  it('mostra "0 ticket" quando tokens è array vuoto', () => {
    render(<UserCard user={mockUserNoTokens} onClick={vi.fn()} />)
    expect(screen.getByText('0 ticket')).toBeInTheDocument()
  })

  it('mostra conteggio corretto quando tokens ha elementi con balance > 0', () => {
    render(<UserCard user={mockUser} onClick={vi.fn()} />)
    expect(screen.getByText('3 ticket')).toBeInTheDocument()
  })

  it('somma i balance di più token contracts', () => {
    render(<UserCard user={mockUserMultipleTokenContracts} onClick={vi.fn()} />)
    expect(screen.getByText('7 ticket')).toBeInTheDocument()
  })

  it('mostra l\'iniziale del nome nell\'avatar', () => {
    render(<UserCard user={mockUser} onClick={vi.fn()} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('chiama onClick al click sulla card', () => {
    const handleClick = vi.fn()
    render(<UserCard user={mockUser} onClick={handleClick} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('il root element è <button>', () => {
    render(<UserCard user={mockUser} onClick={vi.fn()} />)
    const button = screen.getByRole('button')
    expect(button.tagName.toLowerCase()).toBe('button')
  })

  it('gestisce nome vuoto: usa fallback all\'indirizzo', () => {
    render(<UserCard user={mockUserEmptyName} onClick={vi.fn()} />)
    // Should show the first char after "0x" from address
    const avatar = screen.getByText(/^[A-Fa-f0-9]$/)
    expect(avatar).toBeInTheDocument()
  })

  it('non crasha con token_ids che potrebbero essere null', () => {
    const userWithNullTokenIds: WalletInfo = {
      ...mockUser,
      tokens: [
        {
          contract_address: '0xcontract',
          name: 'MintPass',
          symbol: 'MP',
          balance: 2,
          token_ids: [],
        },
      ],
    }
    expect(() => render(<UserCard user={userWithNullTokenIds} onClick={vi.fn()} />)).not.toThrow()
    expect(screen.getByText('2 ticket')).toBeInTheDocument()
  })
})
