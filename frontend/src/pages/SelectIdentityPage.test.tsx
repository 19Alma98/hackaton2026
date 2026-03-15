import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SelectIdentityPage } from './SelectIdentityPage'

// Mock axiosInstance
vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    get: vi.fn(),
  },
}))

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { axiosInstance } from '@/api/axiosInstance'
import { useAuth } from '@/context/AuthContext'

const healthOkResponse = {
  data: {
    status: 'ok',
    block_number: 100,
    rpc_url: 'http://localhost:8545',
    chain_id: 1337,
  },
}

const healthErrorResponse = {
  data: {
    status: 'rpc_unreachable',
    block_number: null,
    rpc_url: 'http://localhost:8545',
    chain_id: 1337,
  },
}

const mockUsers = [
  {
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
        balance: 2,
        token_ids: [1, 2],
      },
    ],
  },
  {
    name: 'Bob',
    address: '0xdef4560000000000000000000000000000000002',
    balance_wei: '500000000000000000',
    balance_eth: 0.5,
    nonce: 1,
    tokens: [],
  },
]

const mockSetCurrentUser = vi.fn()

function renderPage() {
  vi.mocked(useAuth).mockReturnValue({
    currentUser: null,
    setCurrentUser: mockSetCurrentUser,
    refreshCurrentUser: vi.fn(),
    logout: vi.fn(),
  })

  return render(
    <MemoryRouter>
      <SelectIdentityPage />
    </MemoryRouter>
  )
}

describe('SelectIdentityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    mockSetCurrentUser.mockClear()
  })

  it('mostra il titolo "HaCCaTThon - Chain"', () => {
    vi.mocked(axiosInstance.get).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('HaCCaTThon - Chain')).toBeInTheDocument()
  })

  it('chiama GET /api/health al mount', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue(healthOkResponse)
    renderPage()
    await waitFor(() => {
      expect(vi.mocked(axiosInstance.get)).toHaveBeenCalledWith('/api/health')
    })
  })

  it('mostra skeleton cards durante il loading degli utenti (con health ok mockato)', async () => {
    // health returns immediately, users loading hangs
    vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
      if (url === '/api/health') return Promise.resolve(healthOkResponse)
      return new Promise(() => {}) // users loading hangs
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Blockchain connessa')).toBeInTheDocument()
    })
    // Skeleton cards should be visible (3 of them, animate-pulse divs)
    const skeletons = document.querySelectorAll('.animate-pulse')
    // At least some skeleton elements should be present
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('mostra le card utente dopo il fetch con health ok e users mockati', async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
      if (url === '/api/health') return Promise.resolve(healthOkResponse)
      return Promise.resolve({ data: mockUsers })
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('mostra messaggio errore se il fetch utenti fallisce', async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
      if (url === '/api/health') return Promise.resolve(healthOkResponse)
      return Promise.reject(new Error('Network error'))
    })
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByText(/Impossibile caricare gli utenti/)
      ).toBeInTheDocument()
    })
  })

  it('click su una card chiama setCurrentUser con i dati corretti', async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
      if (url === '/api/health') return Promise.resolve(healthOkResponse)
      return Promise.resolve({ data: mockUsers })
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Alice').closest('button')!)
    expect(mockSetCurrentUser).toHaveBeenCalledWith(mockUsers[0])
  })

  it('click su una card naviga a /dashboard', async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
      if (url === '/api/health') return Promise.resolve(healthOkResponse)
      return Promise.resolve({ data: mockUsers })
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Alice').closest('button')!)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('NON mostra la sezione utenti se health check è in errore', async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
      if (url === '/api/health') return Promise.resolve(healthErrorResponse)
      return Promise.resolve({ data: mockUsers })
    })
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('RPC non raggiungibile')).toBeInTheDocument()
    })
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Non è un login tradizionale/)
    ).not.toBeInTheDocument()
  })

  it('mostra "Nessun utente trovato" se la lista è vuota', async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
      if (url === '/api/health') return Promise.resolve(healthOkResponse)
      return Promise.resolve({ data: [] })
    })
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByText('Nessun utente trovato sulla blockchain.')
      ).toBeInTheDocument()
    })
  })

  it('mostra il messaggio "Non è un login tradizionale..." quando blockchain è connessa', async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
      if (url === '/api/health') return Promise.resolve(healthOkResponse)
      return Promise.resolve({ data: mockUsers })
    })
    renderPage()
    await waitFor(() => {
      expect(
        screen.getByText(/Non è un login tradizionale/)
      ).toBeInTheDocument()
    })
  })
})
