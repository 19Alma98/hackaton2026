import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { EVENTS } from '../mock'
import { formatEventDate, formatEth } from '../utils/format'
import { stringToGradient } from '../utils/colors'
import BottomSheet from '../components/BottomSheet'
import Toast from '../components/Toast'
import { useMyTickets } from '../api/hooks/useMyTickets'
import { useWeb3 } from '../hooks/useWeb3'
import { useMarketplaceActions } from '../api/hooks/useMarketplaceActions'

export default function TicketDetailPage() {
  const { tokenId } = useParams()
  const navigate = useNavigate()
  const { address } = useWeb3()
  const { tickets, loading: ticketsLoading, refetch } = useMyTickets(address)
  const { listTicket, cancelListing, actionLoading } = useMarketplaceActions()

  const ticket = tickets.find((t) => t.tokenId === tokenId)
  const event = ticket ? EVENTS.find((e) => e.id === ticket.eventId) : null

  const [sheetOpen, setSheetOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  if (ticketsLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!ticket || !event) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">
        Biglietto non trovato.
      </div>
    )
  }

  const isListed = ticket.status === 'listed'
  const gradient = stringToGradient(ticket.tokenId)

  const handleList = async () => {
    if (!price || isNaN(parseFloat(price))) return
    setLoading(true)
    const { ok, error } = await listTicket(address, ticket.tokenId, price)
    setLoading(false)
    if (ok) {
      setSheetOpen(false)
      setPrice('')
      setToast({ message: `Biglietto messo in vendita a ${price} ETH`, type: 'success' })
      refetch()
    } else {
      setToast({ message: error ?? 'Errore durante la vendita', type: 'error' })
    }
  }

  const handleDelist = async () => {
    setLoading(true)
    const { ok, error } = await cancelListing(address, ticket.tokenId)
    setLoading(false)
    if (ok) {
      setToast({ message: 'Biglietto ritirato dalla vendita', type: 'success' })
      refetch()
    } else {
      setToast({ message: error ?? 'Errore durante il ritiro', type: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Back */}
      <div className="px-4 pt-6 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          I miei biglietti
        </button>
      </div>

      <div className="px-4 space-y-5 pb-10">

        {/* Card NFT grande */}
        <div className={`w-full rounded-3xl bg-gradient-to-br ${gradient} p-5 space-y-4`}>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold text-white leading-tight">{event.name}</h1>
            <StatusBadge isListed={isListed} />
          </div>

          <div className="space-y-1.5 text-sm text-white/70">
            <p className="flex items-center gap-2">
              <CalendarIcon /> {formatEventDate(event.date)}
            </p>
            <p className="flex items-center gap-2">
              <LocationIcon /> {event.venue}
            </p>
            <p className="flex items-center gap-2">
              <SeatIcon /> {ticket.seat}
            </p>
          </div>

          <p className="text-xs font-mono text-white/30">Token ID #{ticket.tokenId}</p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Codice di ingresso</p>
          <div className="bg-white p-4 rounded-2xl shadow-lg">
            <QRCodeSVG
              value={`mintpass://ticket/${ticket.tokenId}`}
              size={180}
              bgColor="#ffffff"
              fgColor="#111827"
              level="M"
            />
          </div>
          <p className="text-xs text-gray-600 font-mono">mintpass://ticket/{ticket.tokenId}</p>
        </div>

        {/* Azioni */}
        {isListed ? (
          <ListedActions
            listingPrice={ticket.listingPrice}
            loading={loading}
            onDelist={handleDelist}
          />
        ) : (
          <OwnedActions onList={() => setSheetOpen(true)} />
        )}
      </div>

      {/* Bottom sheet: inserimento prezzo */}
      <BottomSheet open={sheetOpen} onClose={() => !loading && setSheetOpen(false)}>
        <div className="space-y-5">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Metti in vendita</p>
            <h3 className="text-lg font-bold text-white">{event.name}</h3>
            <p className="text-sm text-gray-400 mt-0.5">{ticket.seat}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Prezzo di vendita</label>
            <div className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus-within:border-violet-500 transition-colors">
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 bg-transparent text-white text-xl font-bold outline-none placeholder-gray-600"
              />
              <span className="text-gray-400 font-medium">ETH</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSheetOpen(false)}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl border border-gray-700 text-gray-400 font-medium text-sm disabled:opacity-40"
            >
              Annulla
            </button>
            <button
              onClick={handleList}
              disabled={loading || !price}
              className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <><Spinner /> Pubblicazione…</> : 'Metti in vendita'}
            </button>
          </div>
        </div>
      </BottomSheet>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  )
}

/* ── Subcomponents ───────────────────────────────────── */

function StatusBadge({ isListed }) {
  return (
    <span className={`shrink-0 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full ${
      isListed
        ? 'bg-orange-500/30 text-orange-300 border border-orange-500/40'
        : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
    }`}>
      {isListed ? 'In vendita' : 'Posseduto'}
    </span>
  )
}

function OwnedActions({ onList }) {
  return (
    <div className="space-y-3">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3.5 text-sm text-gray-400">
        Questo biglietto è nel tuo wallet. Puoi usarlo come accesso all'evento o rivenderlo nel marketplace.
      </div>
      <button
        onClick={onList}
        className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold py-4 rounded-2xl transition-colors"
      >
        Metti in vendita
      </button>
    </div>
  )
}

function ListedActions({ listingPrice, loading, onDelist }) {
  return (
    <div className="space-y-3">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3.5 flex items-center justify-between">
        <span className="text-sm text-gray-400">Prezzo attuale</span>
        <span className="text-xl font-bold text-orange-300">{formatEth(listingPrice)}</span>
      </div>
      <button
        onClick={onDelist}
        disabled={loading}
        className="w-full border border-gray-700 hover:border-gray-600 text-gray-300 font-semibold py-4 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><Spinner /> Ritiro…</> : 'Ritira dalla vendita'}
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
      <path d="M5 .5a.5.5 0 0 1 .5.5v.5h5V1a.5.5 0 0 1 1 0v.5H13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2h1.5V1A.5.5 0 0 1 5 .5zM3 3a1 1 0 0 0-1 1v1h12V4a1 1 0 0 0-1-1H3zm-1 3v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6H2z"/>
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
      <path d="M8 1a5 5 0 1 0 0 10A5 5 0 0 0 8 1zm0 1a4 4 0 1 1 0 8A4 4 0 0 1 8 2zm0 1.5A2.5 2.5 0 0 0 5.5 7c0 1.38 1.12 2.5 2.5 2.5S10.5 8.38 10.5 7A2.5 2.5 0 0 0 8 4.5z"/>
    </svg>
  )
}

function SeatIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
      <path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h13A1.5 1.5 0 0 1 16 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 14.5v-13zM1.5 1a.5.5 0 0 0-.5.5V14a.5.5 0 0 0 .5.5H5v-1.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V14.5h3.5a.5.5 0 0 0 .5-.5V1.5a.5.5 0 0 0-.5-.5h-13z"/>
    </svg>
  )
}
