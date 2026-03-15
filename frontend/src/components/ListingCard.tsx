import type { ListingInfo } from '@/types/api'
import { shortAddress, formatEth } from '@/utils/format'

interface ListingCardProps {
  listing: ListingInfo
  onBuy: () => void
  isMine: boolean
}

export function ListingCard({ listing, onBuy, isMine }: ListingCardProps) {
  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-white font-bold font-mono text-lg">#{listing.token_id}</span>
        <span className="text-violet-400 font-mono font-semibold">{formatEth(listing.price_wei)}</span>
      </div>
      <p className="text-slate-400 text-sm">
        Venditore: <span className="font-mono text-slate-300">{shortAddress(listing.seller)}</span>
      </p>
      {isMine ? (
        <button
          disabled
          className="w-full px-4 py-2 rounded-xl bg-violet-600 text-white opacity-50 cursor-not-allowed"
        >
          Il tuo biglietto
        </button>
      ) : (
        <button
          onClick={onBuy}
          className="w-full px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        >
          Acquista
        </button>
      )}
    </div>
  )
}
