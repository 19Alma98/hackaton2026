import { createContext, useCallback, useContext, useState } from 'react'

const STORAGE_KEY = 'mintpass_address'
const STORAGE_NAME_KEY = 'mintpass_name'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [address, setAddress] = useState(() => localStorage.getItem(STORAGE_KEY) ?? null)
  const [name, setName] = useState(() => localStorage.getItem(STORAGE_NAME_KEY) ?? null)

  const isConnected = Boolean(address)

  const login = useCallback((addr, displayName = null) => {
    localStorage.setItem(STORAGE_KEY, addr)
    setAddress(addr)
    if (displayName) {
      localStorage.setItem(STORAGE_NAME_KEY, displayName)
      setName(displayName)
    } else {
      localStorage.removeItem(STORAGE_NAME_KEY)
      setName(null)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_NAME_KEY)
    setAddress(null)
    setName(null)
  }, [])

  return (
    <AuthContext.Provider value={{ address, name, isConnected, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
