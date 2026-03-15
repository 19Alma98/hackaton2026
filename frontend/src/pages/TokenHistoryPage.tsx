import { useParams } from 'react-router-dom'

export function TokenHistoryPage() {
  const { tokenId } = useParams<{ tokenId: string }>()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050508]">
      <div className="glass-card p-8 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Token <span className="text-violet-400 font-mono">#{tokenId}</span>
        </h1>
        <p className="text-slate-400 text-sm">Storia on-chain — in costruzione</p>
      </div>
    </div>
  )
}
