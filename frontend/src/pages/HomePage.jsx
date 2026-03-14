import { useNavigate } from 'react-router-dom'
import { useWeb3 } from '../hooks/useWeb3'
import { EVENTS } from '../mock'
import { shortAddress, formatEventDate, formatEth } from '../utils/format'
import { stringToGradient } from '../utils/colors'

export default function HomePage() {
  const { address, name } = useWeb3()
  const navigate = useNavigate()

  const [hero, ...rest] = EVENTS

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header sticky */}
      <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur border-b border-gray-800/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar address={address} />
          <div className="leading-tight">
            <p className="text-xs text-gray-500">Connesso come</p>
            <p className="text-sm font-medium text-white">{name ?? shortAddress(address)}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-6 pb-4 space-y-8">

        {/* Hero card */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">In evidenza</h2>
          <HeroCard event={hero} onClick={() => navigate(`/event/${hero.id}`)} />
        </section>

        {/* Lista eventi */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Prossimi eventi</h2>
          <div className="space-y-3">
            {rest.map((event) => (
              <EventCard key={event.id} event={event} onClick={() => navigate(`/event/${event.id}`)} />
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

/* ── Avatar ─────────────────────────────────────────── */
function Avatar({ address }) {
  const gradient = stringToGradient(address)
  const initials = address ? address.slice(2, 4).toUpperCase() : '??'
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
      <span className="text-xs font-bold text-white/80">{initials}</span>
    </div>
  )
}

/* ── Hero card ───────────────────────────────────────── */
function HeroCard({ event, onClick }) {
  const urgency = event.availableTickets <= 3

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl bg-gradient-to-br ${event.gradient} p-5 shadow-lg active:scale-[.98] transition-transform`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-bold leading-tight text-white">{event.name}</h3>
          {urgency && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-full px-2 py-0.5">
              Ultimi posti
            </span>
          )}
        </div>

        <p className="text-sm text-white/60 line-clamp-2">{event.description}</p>

        <div className="flex items-end justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-white/50 flex items-center gap-1">
              <CalendarIcon /> {formatEventDate(event.date)}
            </p>
            <p className="text-xs text-white/50 flex items-center gap-1">
              <LocationIcon /> {event.venue}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-wide">da</p>
            <p className="text-lg font-bold text-white">{formatEth(event.minPrice)}</p>
          </div>
        </div>
      </div>
    </button>
  )
}

/* ── Event card compatta ─────────────────────────────── */
function EventCard({ event, onClick }) {
  const urgency = event.availableTickets <= 3

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 bg-gray-900 hover:bg-gray-800/80 active:bg-gray-800 border border-gray-800 rounded-2xl p-4 transition-colors"
    >
      {/* Dot gradiente */}
      <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${event.gradient}`} />

      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="font-semibold text-sm text-white leading-tight truncate">{event.name}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
          <CalendarIcon /> {formatEventDate(event.date)}
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
          <LocationIcon /> {event.venue}
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1">
        <p className="text-sm font-bold text-violet-300">{formatEth(event.minPrice)}</p>
        {urgency
          ? <span className="text-[10px] text-rose-400 font-medium">Ultimi {event.availableTickets}</span>
          : <span className="text-[10px] text-gray-600">{event.availableTickets} disp.</span>
        }
      </div>
    </button>
  )
}

/* ── Icone inline ────────────────────────────────────── */
function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
      <path d="M5 .5a.5.5 0 0 1 .5.5v.5h5V1a.5.5 0 0 1 1 0v.5H13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2h1.5V1A.5.5 0 0 1 5 .5zM3 3a1 1 0 0 0-1 1v1h12V4a1 1 0 0 0-1-1H3zm-1 3v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6H2z"/>
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
      <path d="M8 1a5 5 0 1 0 0 10A5 5 0 0 0 8 1zm0 1a4 4 0 1 1 0 8A4 4 0 0 1 8 2zm0 1.5A2.5 2.5 0 0 0 5.5 7c0 1.38 1.12 2.5 2.5 2.5S10.5 8.38 10.5 7A2.5 2.5 0 0 0 8 4.5z"/>
    </svg>
  )
}
