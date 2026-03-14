import { useEffect, useState } from 'react'

/**
 * Uso: <Toast message="Testo" type="success|error" onDone={() => setToast(null)} />
 * Si auto-rimuove dopo 3s. Monta/smonta dal genitore in base allo state.
 */
export default function Toast({ message, type = 'success', onDone }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Fade in
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  const colors = type === 'success'
    ? 'bg-emerald-900/90 border-emerald-700 text-emerald-200'
    : 'bg-rose-900/90 border-rose-700 text-rose-200'

  const icon = type === 'success'
    ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[100]
        flex items-center gap-2.5 px-4 py-3
        border rounded-xl shadow-xl backdrop-blur
        text-sm font-medium max-w-[90vw]
        transition-all duration-300
        ${colors}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 shrink-0">
        {icon}
      </svg>
      {message}
    </div>
  )
}
