import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { axiosInstance } from '@/api/axiosInstance'
import type { ListingInfo } from '@/types/api'

interface UseMarketplaceResult {
  readonly listings: readonly ListingInfo[]
  readonly loading: boolean
  readonly error: string | null
  readonly refetch: () => void
}

function resolveErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return 'Impossibile caricare i biglietti in vendita. Verifica che il backend sia attivo.'
    }
    const status = err.response.status
    if (status === 404) {
      return 'Endpoint 404: nessun biglietto trovato.'
    }
    if (status >= 500) {
      return 'Errore del server. Riprova tra qualche secondo.'
    }
    return 'Errore imprevisto nel caricamento del marketplace.'
  }
  return 'Impossibile caricare i biglietti in vendita. Verifica che il backend sia attivo.'
}

export function useMarketplace(): UseMarketplaceResult {
  const [listings, setListings] = useState<ListingInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    setLoading(true)
    setError(null)

    axiosInstance
      .get<ListingInfo[]>('/api/tickets/for-sale', { signal: controller.signal })
      .then((res) => {
        if (!cancelled) {
          setListings(res.data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (cancelled || axios.isCancel(err)) return
        setListings([])
        setError(resolveErrorMessage(err))
        setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  return { listings, loading, error, refetch }
}
