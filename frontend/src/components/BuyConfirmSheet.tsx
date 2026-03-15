import type { ListingInfo } from '@/types/api'
import { shortAddress, formatEth } from '@/utils/format'

interface BuyConfirmSheetProps {
  listing: ListingInfo
  buyerAddress: string
  onConfirm: () => void
  onCancel: () => void
}

export function BuyConfirmSheet({ listing, buyerAddress, onConfirm, onCancel }: BuyConfirmSheetProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-white">Conferma Acquisto</h2>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center py-2 border-b border-white/10">
          <span className="text-slate-400 text-sm">Token</span>
          <span className="text-white font-mono font-bold">#{listing.token_id}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/10">
          <span className="text-slate-400 text-sm">Prezzo</span>
          <span className="text-violet-400 font-mono font-semibold">{formatEth(listing.price_wei)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/10">
          <span className="text-slate-400 text-sm">Venditore</span>
          <span className="text-slate-300 font-mono text-sm">{shortAddress(listing.seller)}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-slate-400 text-sm">Acquirente</span>
          <span className="text-slate-300 font-mono text-sm">{shortAddress(buyerAddress)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600/20 border border-violet-500/30">
        <span className="text-violet-400 text-xs font-semibold">Transazione Blockchain Reale</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
        >
          Conferma
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
        >
          Annulla
        </button>
      </div>
    </div>
  )
}
