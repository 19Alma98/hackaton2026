import type { WalletInfo } from '@/types/api'
import { shortAddress, formatEth } from '@/utils/format'
import { addressToGradient } from '@/utils/colors'

interface UserCardProps {
  readonly user: WalletInfo
  readonly onClick: () => void
}

export function UserCard({ user, onClick }: UserCardProps) {
  const initial =
    user.name.length > 0
      ? user.name.charAt(0).toUpperCase()
      : user.address.charAt(2).toUpperCase()

  const ticketCount = user.tokens.reduce((sum, t) => sum + t.balance, 0)

  return (
    <button
      onClick={onClick}
      className="glass-card p-4 w-full text-left hover:bg-white/10 hover:border-white/20 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg select-none"
          style={{ background: addressToGradient(user.address) }}
        >
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{user.name}</p>
          <p className="text-slate-400 text-sm font-mono">{shortAddress(user.address)}</p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-white font-mono font-semibold text-sm">{formatEth(user.balance_wei)}</p>
          <p className="text-slate-400 text-xs">{ticketCount} ticket</p>
        </div>
      </div>
    </button>
  )
}
