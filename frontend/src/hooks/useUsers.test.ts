import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useUsers } from './useUsers'

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    get: vi.fn(),
  },
}))

// Import after mock
import { axiosInstance } from '@/api/axiosInstance'

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
]

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loading è true inizialmente', () => {
    vi.mocked(axiosInstance.get).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useUsers())
    expect(result.current.loading).toBe(true)
  })

  it('loading diventa false dopo fetch success', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockUsers })
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('loading diventa false dopo fetch error', async () => {
    vi.mocked(axiosInstance.get).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('users contiene i dati dopo fetch success', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockUsers })
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.users).toEqual(mockUsers)
  })

  it('users è [] dopo fetch error', async () => {
    vi.mocked(axiosInstance.get).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.users).toEqual([])
  })

  it('error è null dopo fetch success', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockUsers })
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
  })

  it('error contiene messaggio per errore 404', async () => {
    const axiosError = Object.assign(new Error('Not Found'), {
      isAxiosError: true,
      response: { status: 404 },
    })
    vi.mocked(axiosInstance.get).mockRejectedValue(axiosError)
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Nessun wallet configurato sul backend.')
  })

  it('error contiene messaggio per errore 5xx', async () => {
    const axiosError = Object.assign(new Error('Server Error'), {
      isAxiosError: true,
      response: { status: 500 },
    })
    vi.mocked(axiosInstance.get).mockRejectedValue(axiosError)
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Errore del server. Riprova tra qualche secondo.')
  })

  it('error contiene messaggio per network error (no response)', async () => {
    const axiosError = Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      response: undefined,
    })
    vi.mocked(axiosInstance.get).mockRejectedValue(axiosError)
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe(
      'Impossibile caricare gli utenti. Verifica che il backend sia attivo.'
    )
  })

  it('error contiene messaggio generico per altri errori', async () => {
    vi.mocked(axiosInstance.get).mockRejectedValue({ isAxiosError: true, response: { status: 403 } })
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Errore imprevisto nel caricamento degli utenti.')
  })

  it('gestisce risposta vuota [] senza errore', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: [] })
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.users).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('refetch riesegue la chiamata API', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockUsers })
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(vi.mocked(axiosInstance.get)).toHaveBeenCalledTimes(1)

    vi.mocked(axiosInstance.get).mockResolvedValue({ data: [] })
    await act(async () => { result.current.refetch() })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(vi.mocked(axiosInstance.get)).toHaveBeenCalledTimes(2)
  })

  it('chiama GET /api/wallets', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockUsers })
    const { result } = renderHook(() => useUsers())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(vi.mocked(axiosInstance.get)).toHaveBeenCalledWith('/api/wallets', expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })
})
