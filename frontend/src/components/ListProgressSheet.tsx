import type { TxResult } from '@/types/api'

interface ListProgressSheetProps {
  status: 'approving' | 'listing' | 'success' | 'error'
  approveTxResult: TxResult | null
  listTxResult: TxResult | null
  errorMessage: string | null
}

function StepIndicator({ done, active }: { done: boolean; active: boolean }) {
  if (done) {
    return <span className="text-emerald-400 font-bold text-lg">✓</span>
  }
  if (active) {
    return (
      <span className="inline-block w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
    )
  }
  return <span className="w-5 h-5 rounded-full border-2 border-white/20 inline-block" />
}

export function ListProgressSheet({
  status,
  errorMessage,
}: ListProgressSheetProps) {
  const step1Done = status === 'listing' || status === 'success'
  const step1Active = status === 'approving'
  const step2Done = status === 'success'
  const step2Active = status === 'listing'

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-4 glow-error">
        <h2 className="text-lg font-bold text-white">Listing fallito</h2>
        <div className="flex items-center gap-2">
          <span className="text-rose-400 font-bold text-lg">✗</span>
          <span className="text-rose-400 text-sm">{errorMessage}</span>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-4 glow-success">
        <h2 className="text-lg font-bold text-white">Biglietto in vendita!</h2>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <StepIndicator done={true} active={false} />
            <span className="text-slate-300 text-sm">Approvazione NFT</span>
          </div>
          <div className="flex items-center gap-3">
            <StepIndicator done={true} active={false} />
            <span className="text-slate-300 text-sm">Listing sul Marketplace</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-white">Messa in vendita in corso...</h2>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <StepIndicator done={step1Done} active={step1Active} />
          <span className="text-slate-300 text-sm">Approvazione NFT</span>
        </div>
        <div className="flex items-center gap-3">
          <StepIndicator done={step2Done} active={step2Active} />
          <span className="text-slate-300 text-sm">Listing sul Marketplace</span>
        </div>
      </div>
    </div>
  )
}
