import { useState } from 'react'

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID ?? '1337')
const RPC_URL  = import.meta.env.VITE_RPC_URL ?? 'http://localhost:8545'

export default function WrongNetworkBanner() {
  const [switching, setSwitching] = useState(false)

  const handleSwitch = async () => {
    if (!window.ethereum) return
    setSwitching(true)
    try {
      // wallet_addEthereumChain aggiunge la rete se non esiste,
      // oppure switcha su di essa se è già presente — più affidabile
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${CHAIN_ID.toString(16)}`,
          chainName: 'Mintpass Private',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: [RPC_URL],
        }],
      })
    } catch {
      // utente ha rifiutato il popup
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="bg-amber-950/80 border-b border-amber-700/60 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-amber-400 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-xs text-amber-300 font-medium truncate">
          Rete non corretta — connettiti a Mintpass
        </p>
      </div>
      <button
        onClick={handleSwitch}
        disabled={switching}
        className="shrink-0 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-600/50 text-amber-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {switching ? 'Cambio…' : 'Cambia rete'}
      </button>
    </div>
  )
}
