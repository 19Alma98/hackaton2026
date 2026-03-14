import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeb3 } from '../hooks/useWeb3'
import { MY_TICKETS } from '../mock'
import { stringToGradient } from '../utils/colors'

const MOCK_STATS = {
  purchased: 7,
  sold: 4,
}

export default function ProfilePage() {
  const { address, logout } = useWeb3()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const owned = MY_TICKETS.filter((t) => t.status === 'owned').length
  const gradient = stringToGradient(address)

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header profilo */}
      <div className="px-4 pt-10 pb-6 flex flex-col items-center gap-4 border-b border-gray-800">
        {/* Avatar */}
        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <span className="text-2xl font-bold text-white/80">
            {address ? address.slice(2, 4).toUpperCase() : '??'}
          </span>
        </div>

        {/* Indirizzo + copia */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Indirizzo wallet</p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-xl px-3 py-2 transition-colors"
          >
            <span className="text-sm font-mono text-gray-300 break-all text-center leading-snug">
              {address}
            </span>
            <span className="shrink-0">
              {copied ? <CheckIcon /> : <CopyIcon />}
            </span>
          </button>
          {copied && <p className="text-xs text-emerald-400">Copiato!</p>}
        </div>
      </div>

      {/* Statistiche */}
      <div className="px-4 py-5 border-b border-gray-800">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Statistiche</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={owned} label="In possesso" color="text-violet-300" />
          <StatCard value={MOCK_STATS.purchased} label="Acquistati" color="text-emerald-300" />
          <StatCard value={MOCK_STATS.sold} label="Venduti" color="text-orange-300" />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Esci */}
      <div className="px-4 py-6">
        <button
          onClick={handleLogout}
          className="w-full border border-rose-800 hover:bg-rose-950/40 text-rose-400 font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Esci
        </button>
      </div>

    </div>
  )
}

/* ── Subcomponents ───────────────────────────────────── */

function StatCard({ value, label, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl px-3 py-4 flex flex-col items-center gap-1">
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-gray-500 text-center leading-tight">{label}</span>
    </div>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-500">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-emerald-400">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}
