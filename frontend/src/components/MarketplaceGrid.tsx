import type { ListingInfo } from '@/types/api'
import { ListingCard } from './ListingCard'
import { Skeleton } from './Skeleton'

interface MarketplaceGridProps {
  listings: readonly ListingInfo[]
  loading: boolean
  error: string | null
  currentAddress: string
  onBuy: (listing: ListingInfo) => void
}

export function MarketplaceGrid({
  listings,
  loading,
  error,
  currentAddress,
  onBuy,
}: MarketplaceGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  if (error !== null) {
    return (
      <div className="flex items-center gap-2 text-rose-400 p-4">
        <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="text-slate-500 text-center py-10">
        Nessun biglietto in vendita al momento
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.token_id}
          listing={listing}
          onBuy={() => onBuy(listing)}
          isMine={listing.seller.toLowerCase() === currentAddress.toLowerCase()}
        />
      ))}
    </div>
  )
}
