import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeb3 } from '../hooks/useWeb3'

export default function ConnectPage() {
  const { connect } = useWeb3()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleConnect = async () => {
    setError(null)
    setLoading(true)
    try {
      await connect()
      navigate('/home', { replace: true })
    } catch (err) {
      if (err.message === 'NO_METAMASK') {
        setError('no_metamask')
      } else {
        setError('rejected')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex flex-col items-center justify-between px-6 py-12 text-white">

      {/* Top spacer */}
      <div />

      {/* Center — logo + tagline */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
        </div>

        <div>
          <h1 className="text-4xl font-bold tracking-tight">Mintpass</h1>
          <p className="mt-2 text-gray-400 text-lg">I tuoi biglietti sportivi,<br />sulla blockchain.</p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-gray-500 mt-2">
          {['Biglietti NFT non falsificabili', 'Rivendita sicura peer-to-peer', 'Il tuo wallet, il tuo controllo'].map((feat) => (
            <div key={feat} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom — CTA */}
      <div className="w-full flex flex-col gap-3">
        {error === 'no_metamask' && (
          <div className="bg-rose-950/60 border border-rose-800 rounded-xl px-4 py-3 text-sm text-rose-300 text-center">
            MetaMask non trovato.{' '}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noreferrer"
              className="underline font-medium"
            >
              Installalo qui
            </a>
          </div>
        )}

        {error === 'rejected' && (
          <div className="bg-rose-950/60 border border-rose-800 rounded-xl px-4 py-3 text-sm text-rose-300 text-center">
            Connessione rifiutata. Riprova.
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-lg py-4 rounded-2xl transition-colors flex items-center justify-center gap-3 shadow-lg shadow-violet-900/40"
        >
          {loading ? (
            <>
              <Spinner />
              Connessione in corso…
            </>
          ) : (
            <>
              <MetaMaskIcon />
              Connetti MetaMask
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-600">
          Rete privata Mintpass · Chain ID {import.meta.env.VITE_CHAIN_ID ?? '1337'}
        </p>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

function MetaMaskIcon() {
  return (
    <svg viewBox="0 0 35 33" className="w-6 h-6" fill="none">
      <path d="M32.958 1L19.4 10.693l2.553-5.998L32.958 1z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.043 1l13.43 9.784-2.43-5.998L2.043 1zM28.16 23.507l-3.604 5.52 7.712 2.12 2.21-7.524-6.318-.116zM.523 23.623l2.196 7.524 7.7-2.12-3.59-5.52-6.306.116z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
