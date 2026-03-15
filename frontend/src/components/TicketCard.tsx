import type { TokenBalance } from '@/types/api'
import { changeStringMultiRealBitcoin } from '@/utils/format'

interface TicketCardProps {
  tokenBalance: TokenBalance
  onTokenClick: (tokenId: number) => void
}

export function TicketCard({ tokenBalance, onTokenClick }: TicketCardProps) {
  const tokenIds = tokenBalance.token_ids ?? []

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-medium">{changeStringMultiRealBitcoin(tokenBalance.name)}</p>
          <p className="text-slate-400 text-xs font-mono">{tokenBalance.symbol}</p>
        </div>
        <span className="text-violet-400 text-sm font-bold">
          {tokenBalance.balance} biglietti
        </span>
      </div>
      {tokenIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tokenIds.map((id) => (
            <button
              key={id}
              onClick={() => onTokenClick(id)}
              className="px-2 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 font-mono text-xs transition-colors"
            >
              #{id}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


