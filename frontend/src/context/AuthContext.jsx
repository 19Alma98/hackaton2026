import { createContext, useCallback, useContext, useState } from 'react'

const STORAGE_KEY = 'mintpass_address'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [address, setAddress] = useState(() => localStorage.getItem(STORAGE_KEY) ?? null)

  const isConnected = Boolean(address)

  const login = useCallback((addr) => {
    localStorage.setItem(STORAGE_KEY, addr)
    setAddress(addr)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setAddress(null)
  }, [])

  return (
    <AuthContext.Provider value={{ address, isConnected, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
