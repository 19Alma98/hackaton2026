import { useParams, useNavigate } from 'react-router-dom'
import { useTokenHistory } from '@/hooks/useTokenHistory'
import { shortAddress, formatEth } from '@/utils/format'
import { Skeleton } from '@/components/Skeleton'

export function TokenHistoryPage() {
  const { tokenId } = useParams<{ tokenId: string }>()
  const navigate = useNavigate()
  const id = Number(tokenId)
  const { events, loading, error } = useTokenHistory(id)

  return (
    <div className="min-h-screen bg-[#050508] p-4">
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-8"
        >
          ← Dashboard
        </button>

        <div className="mb-8">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Token NFT</p>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            #{tokenId}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Storico transazioni on-chain — prova di tracciabilità anti-frode
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
            <p className="text-slate-400 text-sm">Nessuna vendita registrata per questo token.</p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-5 top-6 bottom-6 w-px bg-white/10" />

            <div className="flex flex-col gap-0">
              {events.map((event, index) => (
                <div key={event.transaction_hash + index} className="relative flex gap-4 pb-6">
                  {/* dot */}
                  <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
                    <span className="text-violet-300 text-xs font-bold">↔</span>
                  </div>

                  <div className="glass-card p-4 flex-1 min-w-0">
                    {/* header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs text-slate-500 font-mono">Block #{event.block_number}</span>
                      <span className="text-emerald-400 font-bold font-mono text-sm">
                        {formatEth(event.price_wei)}
                      </span>
                    </div>

                    {/* transfer */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-white bg-white/5 px-2 py-1 rounded">
                        {shortAddress(event.seller)}
                      </span>
                      <span className="text-slate-400 text-xs">→</span>
                      <span className="font-mono text-xs text-white bg-white/5 px-2 py-1 rounded">
                        {shortAddress(event.buyer)}
                      </span>
                    </div>

                    {/* tx hash */}
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
