import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EVENTS, LISTINGS } from '../mock'
import { shortAddress, formatEventDate, formatEth } from '../utils/format'
import BottomSheet from '../components/BottomSheet'
import Toast from '../components/Toast'

export default function EventPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const event = EVENTS.find((e) => e.id === id)
  const listings = LISTINGS.filter((l) => l.eventId === id)

  const [selectedListing, setSelectedListing] = useState(null)
  const [buying, setBuying] = useState(false)
  const [toast, setToast] = useState(null)

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">
        Evento non trovato.
      </div>
    )
  }

  const handleBuyConfirm = async () => {
    setBuying(true)
    // Mock: simula attesa transazione
    await new Promise((r) => setTimeout(r, 1800))
    setBuying(false)
    setSelectedListing(null)
    setToast({ message: 'Biglietto acquistato!', type: 'success' })
    setTimeout(() => navigate('/tickets'), 1600)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header gradiente */}
      <div className={`relative bg-gradient-to-b ${event.gradient} pt-12 pb-8 px-4`}>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur"
          aria-label="Torna indietro"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="mt-2 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Evento</p>
          <h1 className="text-2xl font-bold leading-tight text-white">{event.name}</h1>
        </div>
      </div>

      {/* Info evento */}
      <div className="px-4 py-5 space-y-3 border-b border-gray-800">
        <InfoRow icon={<CalendarIcon />} text={formatEventDate(event.date)} />
        <InfoRow icon={<LocationIcon />} text={event.venue} />
        <p className="text-sm text-gray-400 leading-relaxed pt-1">{event.description}</p>
      </div>

      {/* Biglietti disponibili */}
      <div className="px-4 py-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Biglietti disponibili
          </h2>
          <span className="text-xs text-gray-600">{listings.length} nel marketplace</span>
        </div>

        {listings.length === 0 ? (
          <EmptyState />
        ) : (
          listings.map((listing) => (
            <ListingCard
              key={listing.tokenId}
              listing={listing}
              onBuy={() => setSelectedListing(listing)}
            />
          ))
        )}
      </div>

      {/* Bottom sheet conferma acquisto */}
      <BottomSheet open={!!selectedListing} onClose={() => !buying && setSelectedListing(null)}>
        {selectedListing && (
          <div className="space-y-5">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Conferma acquisto</p>
              <h3 className="text-lg font-bold text-white">{event.name}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{selectedListing.seat}</p>
            </div>

            <div className="bg-gray-800/60 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-400">Prezzo totale</span>
              <span className="text-2xl font-bold text-violet-300">{formatEth(selectedListing.price)}</span>
            </div>

            <div className="text-xs text-gray-600 flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Transazione firmata con MetaMask · Il token NFT sarà trasferito al tuo wallet
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedListing(null)}
                disabled={buying}
                className="flex-1 py-3.5 rounded-xl border border-gray-700 text-gray-400 font-medium text-sm disabled:opacity-40"
              >
                Annulla
              </button>
              <button
                onClick={handleBuyConfirm}
                disabled={buying}
                className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {buying ? (
                  <>
                    <Spinner />
                    Acquisto…
                  </>
                ) : (
                  'Conferma acquisto'
                )}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  )
}

/* ── Subcomponents ───────────────────────────────────── */

function InfoRow({ icon, text }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-300">
      <span className="text-gray-500 shrink-0">{icon}</span>
      {text}
    </div>
  )
}

function ListingCard({ listing, onBuy }) {
  return (
    <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3.5">
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium text-white truncate">{listing.seat}</p>
        <p className="text-xs text-gray-500 font-mono truncate">
          Venditore: {shortAddress(listing.seller)}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <p className="text-base font-bold text-violet-300">{formatEth(listing.price)}</p>
        <button
          onClick={onBuy}
          className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          Compra
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-gray-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
        </svg>
      </div>
      <p className="text-gray-500 text-sm">Nessun biglietto disponibile<br />per questo evento.</p>
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
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <path d="M5 .5a.5.5 0 0 1 .5.5v.5h5V1a.5.5 0 0 1 1 0v.5H13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2h1.5V1A.5.5 0 0 1 5 .5zM3 3a1 1 0 0 0-1 1v1h12V4a1 1 0 0 0-1-1H3zm-1 3v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6H2z"/>
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
      <path d="M8 1a5 5 0 1 0 0 10A5 5 0 0 0 8 1zm0 1a4 4 0 1 1 0 8A4 4 0 0 1 8 2zm0 1.5A2.5 2.5 0 0 0 5.5 7c0 1.38 1.12 2.5 2.5 2.5S10.5 8.38 10.5 7A2.5 2.5 0 0 0 8 4.5z"/>
    </svg>
  )
}
