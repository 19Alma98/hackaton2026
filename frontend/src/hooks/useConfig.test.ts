import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    get: vi.fn(),
  },
}))

import { axiosInstance } from '@/api/axiosInstance'
import { useConfig } from './useConfig'
import type { AppConfig } from '@/types/api'

const mockConfig: AppConfig = {
  chain_id: 1337,
  rpc_url: 'http://localhost:8545',
  nft_contract_address: '0xnft',
  marketplace_contract_address: '0xmarketplace',
}

describe('useConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loading è true inizialmente', () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockConfig })
    const { result } = renderHook(() => useConfig())
    expect(result.current.loading).toBe(true)
  })

  it('loading è false dopo success', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockConfig })
    const { result } = renderHook(() => useConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('config contiene AppConfig dopo success', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockConfig })
    const { result } = renderHook(() => useConfig())
    await waitFor(() => expect(result.current.config).toEqual(mockConfig))
  })

  it('config è null e error ha messaggio dopo errore', async () => {
    vi.mocked(axiosInstance.get).mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.config).toBeNull()
    expect(result.current.error).toBe('Impossibile caricare la configurazione.')
  })

  it('chiama GET /api/config con AbortSignal', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: mockConfig })
    renderHook(() => useConfig())
    await waitFor(() =>
      expect(vi.mocked(axiosInstance.get)).toHaveBeenCalledWith(
        '/api/config',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    )
  })
})
