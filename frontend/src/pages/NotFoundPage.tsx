import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050508]">
      <div className="glass-card p-8 text-center max-w-sm w-full">
        <p className="text-6xl font-bold text-white/10 mb-2">404</p>
        <h1 className="text-xl font-semibold text-white mb-1">Pagina non trovata</h1>
        <p className="text-slate-400 text-sm mb-6">
          Questo indirizzo non esiste sulla blockchain dell'app.
        </p>
        <Link
          to="/"
          className="inline-block px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          Torna all'inizio
        </Link>
      </div>
    </div>
  )
}
