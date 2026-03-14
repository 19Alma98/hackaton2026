/** Blocco skeleton generico — usa className per dimensioni */
export function Skeleton({ className = '' }) {
  return (
    <div className={`bg-gray-800 rounded-xl animate-pulse ${className}`} />
  )
}

/** Skeleton per event card compatta (lista HomePage) */
export function EventCardSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <Skeleton className="w-12 h-12 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="w-14 h-8 shrink-0 rounded-lg" />
    </div>
  )
}

/** Skeleton per NFT card (griglia MyTicketsPage) */
export function TicketCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
      <Skeleton className="w-full h-24 rounded-none" />
      <div className="px-3 py-2.5 space-y-2">
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  )
}
