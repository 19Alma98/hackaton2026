import { useNavigate } from 'react-router-dom'
import { EVENTS } from '../mock'
import { formatEventDate } from '../utils/format'
import { stringToGradient } from '../utils/colors'
import { useMyTickets } from '../api/hooks/useMyTickets'
import { useWeb3 } from '../hooks/useWeb3'

export default function MyTicketsPage() {
  const navigate = useNavigate()
  const { address } = useWeb3()
  const { tickets, loading } = useMyTickets(address)

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="px-4 pt-8 pb-5">
        <h1 className="text-2xl font-bold text-white">I miei biglietti</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {loading
            ? 'Caricamento…'
            : tickets.length > 0
              ? `${tickets.length} bigliett${tickets.length === 1 ? 'o' : 'i'} nel tuo wallet`
              : 'Nessun biglietto ancora'}
        </p>
      </div>

      {loading ? (
        <SkeletonCards />
      ) : tickets.length === 0 ? (
        <EmptyState onDiscover={() => navigate('/home')} />
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3 pb-6">
          {tickets.map((ticket) => {
            const event = EVENTS.find((e) => e.id === ticket.eventId)
            return (
              <TicketCard
                key={ticket.tokenId}
                ticket={ticket}
                event={event}
                onClick={() => navigate(`/ticket/${ticket.tokenId}`)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── NFT Card ────────────────────────────────────────── */
function TicketCard({ ticket, event, onClick }) {
  const gradient = stringToGradient(ticket.tokenId)
  const isListed = ticket.status === 'listed'

  return (
    <button
      onClick={onClick}
      className="text-left flex flex-col rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 active:scale-[.97] transition-transform"
    >
      {/* Banda gradiente superiore */}
      <div className={`w-full h-24 bg-gradient-to-br ${gradient} relative`}>
        {/* Badge status */}
        <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
          isListed
            ? 'bg-orange-500/30 text-orange-300 border border-orange-500/40'
            : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
        }`}>
          {isListed ? 'In vendita' : 'Posseduto'}
        </span>

        {/* Token ID */}
        <span className="absolute bottom-2 left-2.5 text-[10px] font-mono text-white/40">
          #{ticket.tokenId}
        </span>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 space-y-0.5">
        <p className="text-xs font-semibold text-white leading-tight line-clamp-2">
          {event?.name ?? 'Evento sconosciuto'}
        </p>
        <p className="text-[10px] text-gray-500">
          {event ? formatEventDate(event.date) : '—'}
        </p>
        <p className="text-[10px] text-gray-600 line-clamp-1 pt-0.5">
          {ticket.seat}
        </p>
      </div>
    </button>
  )
}

/* ── Skeleton ────────────────────────────────────────── */
function SkeletonCards() {
  return (
    <div className="px-4 grid grid-cols-2 gap-3 pb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-36 rounded-2xl bg-gray-800 animate-pulse" />
      ))}
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────── */
function EmptyState({ onDiscover }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-9 h-9 text-gray-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
        </svg>
      </div>
      <div>
        <p className="text-white font-semibold">Nessun biglietto ancora</p>
        <p className="text-sm text-gray-500 mt-1">I tuoi biglietti NFT appariranno qui<br />dopo il primo acquisto.</p>
      </div>
      <button
        onClick={onDiscover}
        className="mt-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
      >
        Scopri eventi
      </button>
    </div>
  )
}
