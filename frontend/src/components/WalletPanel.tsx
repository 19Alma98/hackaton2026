import type { WalletInfo } from '@/types/api'
import { addressToGradient } from '@/utils/colors'
import { AddressChip } from './AddressChip'
import { EthBadge } from './EthBadge'
import { TicketCard } from './TicketCard'

interface WalletPanelProps {
  wallet: WalletInfo
  onTokenClick: (tokenId: number) => void
  onLogout: () => void
}

export function WalletPanel({ wallet, onTokenClick, onLogout }: WalletPanelProps) {
  const initial =
    wallet.name.length > 0
      ? wallet.name.charAt(0).toUpperCase()
      : wallet.address.charAt(2).toUpperCase()

  return (
    <div className="glass-card p-6 flex flex-col gap-5">
      <span className="text-xs font-semibold text-violet-400 bg-violet-600/20 px-2 py-1 rounded-full w-fit">
        Identità Blockchain
      </span>

      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xl select-none"
          style={{ background: addressToGradient(wallet.address) }}
        >
          {initial}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-white font-semibold text-lg">{wallet.name}</p>
          <AddressChip address={wallet.address} />
        </div>
      </div>

      <EthBadge weiValue={wallet.balance_wei} size="lg" />

      <div className="flex flex-col gap-3">
        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
          I tuoi biglietti
        </p>
        {wallet.tokens.length === 0 ? (
          <p className="text-slate-500 text-sm">Nessun biglietto ancora</p>
        ) : (
          <div className="flex flex-col gap-2">
            {wallet.tokens.map((token) => (
              <TicketCard
                key={token.contract_address}
                tokenBalance={token}
                onTokenClick={onTokenClick}
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onLogout}
        className="w-full px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors text-sm"
      >
        Cambia identità
      </button>
    </div>
  )
}
