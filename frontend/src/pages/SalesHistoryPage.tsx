import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { axiosInstance } from '@/api/axiosInstance'
import { shortAddress, formatEth } from '@/utils/format'
import { Skeleton } from '@/components/Skeleton'
import type { EventSold } from '@/types/api'

export function SalesHistoryPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventSold[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    axiosInstance
      .get<EventSold[]>('/api/events/sold', { signal: controller.signal })
      .then((res) => {
        if (cancelled) return
        const sorted = [...res.data].sort((a, b) => b.block_number - a.block_number)
        setEvents(sorted)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled || axios.isCancel(err)) return
        setError('Impossibile caricare lo storico delle vendite.')
        setLoading(false)
      })

    return () => { cancelled = true; controller.abort() }
  }, [])

  return (
    <div className="min-h-screen bg-[#050508] p-4">
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-8"
        >
          ← Torna alla selezione
        </button>

        <div className="mb-8">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Blockchain</p>
          <h1 className="text-4xl font-bold tracking-tight text-white">Storico Vendite</h1>
          <p className="text-slate-500 text-sm mt-1">
            Tutte le transazioni registrate on-chain — tracciabilità anti-frode
          </p>
        </div>

        {loading && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        )}

        {error && (
          <div className="glass-card p-4 flex items-start gap-3">
            <div className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0 bg-rose-500" />
            <p className="text-white text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-slate-400 text-sm">Nessuna vendita registrata sulla blockchain.</p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="relative">
            <div className="absolute left-5 top-6 bottom-6 w-px bg-white/10" />
            <div className="flex flex-col gap-0">
              {events.map((event, index) => (
                <div key={event.transaction_hash + index} className="relative flex gap-4 pb-6">
                  <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
                    <span className="text-violet-300 text-xs font-bold">↔</span>
                  </div>

                  <div className="glass-card p-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <button
                        onClick={() => navigate('/token/' + event.token_id)}
                        className="text-white font-bold font-mono hover:text-violet-300 transition-colors"
                      >
                        #{event.token_id}
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-bold font-mono text-sm">
                          {formatEth(event.price_wei)}
                        </span>
                        <span className="text-slate-600 text-xs font-mono">Block #{event.block_number}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-white bg-white/5 px-2 py-1 rounded">
                        {shortAddress(event.seller)}
                      </span>
                      <span className="text-slate-400 text-xs">→</span>
                      <span className="font-mono text-xs text-white bg-white/5 px-2 py-1 rounded">
                        {shortAddress(event.buyer)}
                      </span>
                    </div>

                    <p className="mt-2 text-slate-600 text-xs font-mono truncate">
                      tx: {event.transaction_hash}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
