import type { TokenBalance } from '@/types/api'
import { changeStringMultiRealBitcoin } from '@/utils/format'

interface TicketCardProps {
  tokenBalance: TokenBalance
  onTokenClick: (tokenId: number) => void
  onSell: (tokenId: number) => void
  listedTokenIds?: readonly number[]
}

export function TicketCard({ tokenBalance, onTokenClick, onSell, listedTokenIds = [] }: TicketCardProps) {
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
        <div className="flex flex-col gap-2">
          {tokenIds.map((id) => {
            const isListed = listedTokenIds.includes(id)
            return (
              <div key={id} className="flex items-center justify-between gap-1 border-b border-white/10 pb-2">
                <button
                  onClick={() => onTokenClick(id)}
                  className="px-2 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 font-mono text-xs transition-colors"
                >
                  #{id}
                </button>
                <button
                  onClick={() => !isListed && onSell(id)}
                  disabled={isListed}
                  className={`px-2 py-1 rounded-lg font-mono text-xs transition-colors ${
                    isListed
                      ? 'bg-white/5 text-slate-500 cursor-not-allowed opacity-60'
                      : 'bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-300 cursor-pointer'
                  }`}
                >
                  {isListed ? 'In vendita' : 'Vendi'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
