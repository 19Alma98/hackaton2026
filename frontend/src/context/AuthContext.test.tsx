import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import type { WalletInfo } from '@/types/api'

const makeWallet = (address: string, name = 'User'): WalletInfo => ({
  name,
  address,
  balance_wei: '1000000000000000000',
  balance_eth: 1.0,
  nonce: 0,
  tokens: [],
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('useAuth lancia errore se usato fuori da AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth deve essere usato dentro <AuthProvider>')
  })

  it('currentUser è null inizialmente', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.currentUser).toBeNull()
  })

  it('setCurrentUser aggiorna currentUser e sessionStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const wallet = makeWallet('0xabc')
    act(() => {
      result.current.setCurrentUser(wallet)
    })
    expect(result.current.currentUser).toEqual(wallet)
    const stored = JSON.parse(sessionStorage.getItem('mintpass_current_user') ?? 'null')
    expect(stored).toEqual(wallet)
  })

  it('logout setta currentUser a null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => {
      result.current.setCurrentUser(makeWallet('0xabc'))
    })
    act(() => {
      result.current.logout()
    })
    expect(result.current.currentUser).toBeNull()
  })

  it('logout rimuove il dato da sessionStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => {
      result.current.setCurrentUser(makeWallet('0xabc'))
    })
    act(() => {
      result.current.logout()
    })
    expect(sessionStorage.getItem('mintpass_current_user')).toBeNull()
  })

  it('refreshCurrentUser aggiorna currentUser se trova lo stesso address', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const original = makeWallet('0xABC123', 'Alice')
    act(() => {
      result.current.setCurrentUser(original)
    })
    const updated = makeWallet('0xABC123', 'Alice Updated')
    const users: WalletInfo[] = [makeWallet('0xOTHER', 'Bob'), updated]
    act(() => {
      result.current.refreshCurrentUser(users)
    })
    expect(result.current.currentUser).toEqual(updated)
  })

  it('refreshCurrentUser fa confronto case-insensitive degli address', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const original = makeWallet('0xabc123', 'Alice')
    act(() => {
      result.current.setCurrentUser(original)
    })
    const updatedWithUppercase = makeWallet('0xABC123', 'Alice v2')
    act(() => {
      result.current.refreshCurrentUser([updatedWithUppercase])
    })
    expect(result.current.currentUser).toEqual(updatedWithUppercase)
  })

  it('refreshCurrentUser mantiene currentUser invariato se address non trovato', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    const original = makeWallet('0xabc', 'Alice')
    act(() => {
      result.current.setCurrentUser(original)
    })
    act(() => {
      result.current.refreshCurrentUser([makeWallet('0xother', 'Bob')])
    })
    expect(result.current.currentUser).toEqual(original)
  })

  it('refreshCurrentUser non fa nulla se currentUser è null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => {
      result.current.refreshCurrentUser([makeWallet('0xabc', 'Alice')])
    })
    expect(result.current.currentUser).toBeNull()
  })
})
