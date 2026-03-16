import { useState, useEffect } from 'react'
import axios from 'axios'
import { axiosInstance } from '@/api/axiosInstance'
import type { EventSold } from '@/types/api'

interface UseTokenHistoryResult {
  events: readonly EventSold[]
  loading: boolean
  error: string | null
}

export function useTokenHistory(tokenId: number): UseTokenHistoryResult {
  const [events, setEvents] = useState<EventSold[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    setLoading(true)
    setError(null)

    axiosInstance
      .get<EventSold[]>('/api/events/sold', { signal: controller.signal })
      .then((res) => {
        if (cancelled) return
        const filtered = res.data.filter((e) => e.token_id === tokenId)
        const sorted = [...filtered].sort((a, b) => b.block_number - a.block_number)
        setEvents(sorted)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled || axios.isCancel(err)) return
        setError('Impossibile caricare la storia del token.')
        setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [tokenId])

  return { events, loading, error }
}
