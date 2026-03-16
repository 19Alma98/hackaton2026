import { shortAddress } from '@/utils/format'

interface TxAnimationProps {
  status: 'pending' | 'success' | 'error'
  txHash?: string | null
  errorMessage?: string | null
}

export function TxAnimation({ status, txHash, errorMessage }: TxAnimationProps) {
  if (status === 'pending') {
    return (
      <div className="flex flex-col items-center gap-4 py-6 glow-pending rounded-xl">
        <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-white font-medium">Transazione in corso...</p>
        {txHash !== null && txHash !== undefined && (
          <p className="text-slate-400 font-mono text-xs">{shortAddress(txHash)}</p>
        )}
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-6 glow-success rounded-xl">
        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
          <span className="text-white text-2xl">&#10003;</span>
        </div>
        <p className="text-emerald-400 font-bold text-lg">Biglietto acquistato!</p>
        {txHash !== null && txHash !== undefined && (
          <p className="text-slate-400 font-mono text-xs">{shortAddress(txHash)}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6 glow-error rounded-xl">
      <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center">
        <span className="text-white text-2xl">&#10007;</span>
      </div>
      <p className="text-rose-400 font-medium text-center">
        {errorMessage ?? 'Errore durante la transazione'}
      </p>
    </div>
  )
}
