import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

// Mock hooks before imports
vi.mock('@/hooks/useMarketplace', () => ({
  useMarketplace: vi.fn(),
}))

vi.mock('@/hooks/useBuyTicket', () => ({
  useBuyTicket: vi.fn(),
}))

vi.mock('@/hooks/useConfig', () => ({
  useConfig: vi.fn(),
}))

vi.mock('@/hooks/useListTicket', () => ({
  useListTicket: vi.fn(),
}))

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

import { useMarketplace } from '@/hooks/useMarketplace'
import { useBuyTicket } from '@/hooks/useBuyTicket'
import { useConfig } from '@/hooks/useConfig'
import { useListTicket } from '@/hooks/useListTicket'
import { useNavigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { axiosInstance } from '@/api/axiosInstance'
import { DashboardPage } from './DashboardPage'
import type { WalletInfo, ListingInfo } from '@/types/api'

const mockNavigate = vi.fn()

const mockWallet: WalletInfo = {
  name: 'Alice',
  address: '0xalice0000000000000000000000000000000001',
  balance_wei: '2000000000000000000',
  balance_eth: 2.0,
  nonce: 0,
  tokens: [
    {
      contract_address: '0xcontract',
      name: 'MintPass',
      symbol: 'MP',
      balance: 1,
      token_ids: [99],
    },
  ],
}

const mockListings: ListingInfo[] = [
  { token_id: 1, seller: '0xseller0000000000000000000000000000000001', price_wei: '500000000000000000' },
]

const mockBuyState = {
  state: { status: 'idle' as const, listing: null, txResult: null, error: null },
  startBuy: vi.fn(),
  confirmBuy: vi.fn(),
  cancelBuy: vi.fn(),
  reset: vi.fn(),
}

const mockListState = {
  state: {
    status: 'idle' as const,
    tokenId: null,
    priceWei: null,
    approveTxResult: null,
    listTxResult: null,
    error: null,
  },
  startList: vi.fn(),
  setPrice: vi.fn(),
  confirmList: vi.fn().mockResolvedValue(undefined),
  cancel: vi.fn(),
  reset: vi.fn(),
}

const mockConfig = {
  config: {
    chain_id: 1337,
    rpc_url: 'http://localhost:8545',
    nft_contract_address: '0xnft',
    marketplace_contract_address: '0xmarketplace',
  },
  loading: false,
  error: null,
}

function renderWithAuth(ui: ReactNode) {
  return render(
    <AuthProvider>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </AuthProvider>
  )
}

// Helper to inject currentUser into AuthProvider
function renderAuthenticated(wallet: WalletInfo = mockWallet) {
  // We inject via sessionStorage since AuthProvider loads from it
  sessionStorage.setItem('mintpass_current_user', JSON.stringify(wallet))
  const result = renderWithAuth(<DashboardPage />)
  return result
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(useMarketplace).mockReturnValue({
      listings: mockListings,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
    vi.mocked(useBuyTicket).mockReturnValue(mockBuyState)
    vi.mocked(useConfig).mockReturnValue(mockConfig)
    vi.mocked(useListTicket).mockReturnValue(mockListState)
  })

  it('mostra il nome utente corrente', () => {
    renderAuthenticated()
    // Alice appears in header and WalletPanel — both are correct
    const allAlice = screen.getAllByText('Alice')
    expect(allAlice.length).toBeGreaterThanOrEqual(1)
  })

  it('mostra WalletPanel con i dati del wallet', () => {
    renderAuthenticated()
    expect(screen.getByText(/Identità Blockchain/i)).toBeInTheDocument()
    expect(screen.getByText(/2 ETH/)).toBeInTheDocument()
  })

  it('mostra MarketplaceGrid con i listings', () => {
    renderAuthenticated()
    expect(screen.getByText(/#1/)).toBeInTheDocument()
  })

  it('click su Acquista apre BottomSheet (status confirming)', () => {
    const startBuy = vi.fn()
    vi.mocked(useBuyTicket).mockReturnValue({ ...mockBuyState, startBuy })
    renderAuthenticated()
    fireEvent.click(screen.getByRole('button', { name: /Acquista/i }))
    expect(startBuy).toHaveBeenCalledWith(mockListings[0])
  })

  it('BottomSheet mostra BuyConfirmSheet quando status è confirming', () => {
    vi.mocked(useBuyTicket).mockReturnValue({
      ...mockBuyState,
      state: {
        status: 'confirming',
        listing: mockListings[0],
        txResult: null,
        error: null,
      },
    })
    renderAuthenticated()
    expect(screen.getByText(/Conferma Acquisto/i)).toBeInTheDocument()
  })

  it('click Conferma nella modale chiama confirmBuy', async () => {
    const confirmBuy = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useBuyTicket).mockReturnValue({
      ...mockBuyState,
      confirmBuy,
      state: {
        status: 'confirming',
        listing: mockListings[0],
        txResult: null,
        error: null,
      },
    })
    renderAuthenticated()
    fireEvent.click(screen.getByRole('button', { name: /^Conferma$/i }))
    expect(confirmBuy).toHaveBeenCalledTimes(1)
  })

  it('dopo success mostra TxAnimation con status success', () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: [mockWallet] })
    vi.mocked(useBuyTicket).mockReturnValue({
      ...mockBuyState,
      state: {
        status: 'success',
        listing: mockListings[0],
        txResult: {
          tx_hash: '0xhash',
          status: 'success',
          block_number: 100,
          gas_used: 50000,
          from_address: mockWallet.address,
          to_address: null,
          value_wei: null,
          error: null,
        },
        error: null,
      },
    })
    renderAuthenticated()
    expect(screen.getByText(/Biglietto acquistato!/i)).toBeInTheDocument()
  })

  it('click Cambia identità fa logout e naviga a /', async () => {
    renderAuthenticated()
    fireEvent.click(screen.getByRole('button', { name: /Cambia identità/i }))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
    expect(sessionStorage.getItem('mintpass_current_user')).toBeNull()
  })

  it('click su ticket naviga a /token/{tokenId}', () => {
    renderAuthenticated()
    fireEvent.click(screen.getByText('#99'))
    expect(mockNavigate).toHaveBeenCalledWith('/token/99')
  })

  it('chiama GET /api/wallets al mount per aggiornare i dati utente', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: [mockWallet] })
    renderAuthenticated()
    await waitFor(() =>
      expect(vi.mocked(axiosInstance.get)).toHaveBeenCalledWith('/api/wallets', expect.objectContaining({ signal: expect.any(AbortSignal) }))
    )
  })

  it('Toast visibile dopo acquisto completato (success)', () => {
    vi.mocked(useBuyTicket).mockReturnValue({
      ...mockBuyState,
      state: {
        status: 'success',
        listing: mockListings[0],
        txResult: { tx_hash: null, status: 'success', block_number: null, gas_used: null, from_address: null, to_address: null, value_wei: null, error: null },
        error: null,
      },
    })
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: [mockWallet] })
    renderAuthenticated()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('useConfig viene chiamato', () => {
    renderAuthenticated()
    expect(vi.mocked(useConfig)).toHaveBeenCalled()
  })

  it('click Vendi su un token apre la BottomSheet listing (startList chiamato)', () => {
    const startList = vi.fn()
    vi.mocked(useListTicket).mockReturnValue({ ...mockListState, startList })
    renderAuthenticated()
    const vendiButtons = screen.getAllByRole('button', { name: /Vendi/i })
    fireEvent.click(vendiButtons[0])
    expect(startList).toHaveBeenCalledWith(99)
  })

  it('BottomSheet listing mostra PriceInputSheet quando status è price-input', () => {
    vi.mocked(useListTicket).mockReturnValue({
      ...mockListState,
      state: {
        ...mockListState.state,
        status: 'price-input',
        tokenId: 99,
      },
    })
    renderAuthenticated()
    expect(screen.getByText(/Metti in vendita #99/i)).toBeInTheDocument()
  })

  it('startList viene chiamato con il tokenId corretto al click di Vendi', () => {
    const startList = vi.fn()
    vi.mocked(useListTicket).mockReturnValue({ ...mockListState, startList })
    renderAuthenticated()
    const vendiButtons = screen.getAllByRole('button', { name: /Vendi/i })
    fireEvent.click(vendiButtons[0])
    expect(startList).toHaveBeenCalledWith(99)
  })
})
