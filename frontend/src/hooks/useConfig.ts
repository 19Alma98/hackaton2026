import { useState, useEffect } from 'react'
import axios from 'axios'
import { axiosInstance } from '@/api/axiosInstance'
import type { AppConfig } from '@/types/api'

interface UseConfigReturn {
  readonly config: AppConfig | null
  readonly loading: boolean
  readonly error: string | null
}

export function useConfig(): UseConfigReturn {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    setLoading(true)
    setError(null)

    axiosInstance
      .get<AppConfig>('/api/config', { signal: controller.signal })
      .then((res) => {
        if (!cancelled) {
          setConfig(res.data)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (cancelled || axios.isCancel(err)) return
        setConfig(null)
        setError('Impossibile caricare la configurazione.')
        setLoading(false)
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return { config, loading, error }
}
