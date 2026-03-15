import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { WalletInfo } from '@/types/api'

const STORAGE_KEY = 'mintpass_current_user'

interface AuthContextValue {
  currentUser: WalletInfo | null
  setCurrentUser: (user: WalletInfo) => void
  refreshCurrentUser: (users: WalletInfo[]) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function loadFromStorage(): WalletInfo | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WalletInfo) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<WalletInfo | null>(loadFromStorage)

  const setCurrentUser = useCallback((user: WalletInfo) => {
    setCurrentUserState(user)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  }, [])

  const refreshCurrentUser = useCallback((users: WalletInfo[]) => {
    setCurrentUserState((prev) => {
      if (prev === null) return null
      const updated = users.find(
        (u) => u.address.toLowerCase() === prev.address.toLowerCase()
      )
      return updated !== undefined ? updated : prev
    })
  }, [])

  const logout = useCallback(() => {
    setCurrentUserState(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, refreshCurrentUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  }
  return context
}
