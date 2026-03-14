import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeb3 } from '../hooks/useWeb3'
import { stringToGradient } from '../utils/colors'
import { shortAddress } from '../utils/format'
import { getWallets } from '../api/generated/wallets/wallets'

const { getWalletsApiWalletsGet } = getWallets()

const FALLBACK_DEMO_ACCOUNTS = [
  { name: 'Marco R.', address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' },
  { name: 'Laura B.', address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' },
  { name: 'Andrea C.', address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc' },
]

export default function ConnectPage() {
  const { login } = useWeb3()
  const navigate = useNavigate()
  const [custom, setCustom] = useState('')
  const [error, setError] = useState(null)
  const [demoAccounts, setDemoAccounts] = useState(FALLBACK_DEMO_ACCOUNTS)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  useEffect(() => {
    getWalletsApiWalletsGet()
      .then((data) => {
        const active = data?.filter((w) => w.balance_eth > 0)
        if (active && active.length > 0) setDemoAccounts(active)
      })
      .catch(() => { /* keep fallback */ })
      .finally(() => setLoadingAccounts(false))
  }, [])

  const handleSelect = (account) => {
    login(account.address, account.name)
    navigate('/home', { replace: true })
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    const trimmed = custom.trim()
    if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
      setError('Indirizzo non valido. Deve essere un indirizzo Ethereum (0x…)')
      return
    }
    login(trimmed.toLowerCase())
    navigate('/home', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex flex-col items-center justify-between px-6 py-12 text-white">

      {/* Top spacer */}
      <div />

      {/* Center — logo + tagline */}
      <div className="flex flex-col items-center gap-6 text-center w-full">
        <div className="w-20 h-20 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
        </div>

        <div>
          <h1 className="text-4xl font-bold tracking-tight">Mintpass</h1>
          <p className="mt-2 text-gray-400 text-lg">I tuoi biglietti sportivi,<br />sulla blockchain.</p>
        </div>

        {/* Demo accounts */}
        <div className="w-full mt-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Accedi come utente demo
          </p>
          <div className="flex flex-col gap-2">
            {loadingAccounts
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="w-full h-[60px] bg-gray-800 rounded-2xl animate-pulse" />
                ))
              : null}
            {!loadingAccounts && demoAccounts.map((account) => (
              <button
                key={account.address}
                onClick={() => handleSelect(account)}
                className="w-full flex items-center gap-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-violet-700 rounded-2xl px-4 py-3 transition-colors text-left"
              >
                <Avatar address={account.address} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{account.name}</span>
                  <span className="text-xs font-mono text-gray-500">{shortAddress(account.address)}</span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-600 ml-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Custom address */}
        <div className="w-full">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Oppure inserisci un indirizzo
          </p>
          <form onSubmit={handleCustomSubmit} className="flex flex-col gap-2">
            <input
              type="text"
              value={custom}
              onChange={(e) => { setCustom(e.target.value); setError(null) }}
              placeholder="0x..."
              className="w-full bg-gray-900 border border-gray-700 focus:border-violet-600 rounded-xl px-4 py-3 text-sm font-mono text-gray-300 placeholder-gray-600 outline-none transition-colors"
            />
            {error && (
              <p className="text-xs text-rose-400 text-left">{error}</p>
            )}
            <button
              type="submit"
              disabled={!custom.trim()}
              className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Continua
            </button>
          </form>
        </div>
      </div>

      {/* Bottom label */}
      <p className="text-center text-xs text-gray-700">
        Demo — nessuna autenticazione reale
      </p>

    </div>
  )
}

function Avatar({ address }) {
  const gradient = stringToGradient(address)
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
      <span className="text-xs font-bold text-white/80">
        {address ? address.slice(2, 4).toUpperCase() : '??'}
      </span>
    </div>
  )
}
