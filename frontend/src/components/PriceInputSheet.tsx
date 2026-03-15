import { useState } from 'react'
import { parseEther } from 'ethers'

interface PriceInputSheetProps {
  tokenId: number
  onConfirm: (priceWei: string) => void
  onCancel: () => void
}

export function PriceInputSheet({ tokenId, onConfirm, onCancel }: PriceInputSheetProps) {
  const [ethInput, setEthInput] = useState('')

  const parsedValue = (() => {
    try {
      const n = parseFloat(ethInput)
      if (!Number.isFinite(n) || n <= 0) return null
      return parseEther(ethInput).toString()
    } catch {
      return null
    }
  })()

  const isValid = parsedValue !== null

  const handleConfirm = () => {
    if (parsedValue !== null) {
      onConfirm(parsedValue)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-white">Metti in vendita #{tokenId}</h2>

      <div className="flex flex-col gap-2">
        <label className="text-slate-400 text-sm">Prezzo in ETH</label>
        <input
          type="number"
          step="any"
          min="0"
          value={ethInput}
          onChange={(e) => setEthInput(e.target.value)}
          placeholder="es. 0.5"
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600/20 border border-violet-500/30">
        <span className="text-violet-400 text-xs font-semibold">Transazione Blockchain</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
        >
          Conferma
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 transition-colors"
        >
          Annulla
        </button>
      </div>
    </div>
  )
}
