import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { axiosInstance } from '@/api/axiosInstance'
import type { WalletInfo } from '@/types/api'

interface UseUsersReturn {
  readonly users: readonly WalletInfo[]
  readonly loading: boolean
  readonly error: string | null
  readonly refetch: () => void
}

function resolveErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return 'Impossibile caricare gli utenti. Verifica che il backend sia attivo.'
    }
    const status = err.response.status
    if (status === 404) {
      return 'Nessun wallet configurato sul backend.'
    }
    if (status >= 500) {
      return 'Errore del server. Riprova tra qualche secondo.'
    }
    return 'Errore imprevisto nel caricamento degli utenti.'
  }
  return 'Impossibile caricare gli utenti. Verifica che il backend sia attivo.'
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<WalletInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    setLoading(true)
    setError(null)

    axiosInstance
      .get<WalletInfo[]>('/api/wallets', { signal: controller.signal })
      .then((res) => {
        if (!cancelled) {
          setUsers(res.data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (cancelled || axios.isCancel(err)) return
        setUsers([])
        setError(resolveErrorMessage(err))
        setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  return { users, loading, error, refetch }
}
