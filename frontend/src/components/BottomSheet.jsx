import { useEffect, useState } from 'react'

/**
 * Uso:
 * <BottomSheet open={bool} onClose={() => ...}>
 *   ...contenuto...
 * </BottomSheet>
 */
export default function BottomSheet({ open, onClose, children }) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  // Derived state — sincrono in render, nessun setState in effect
  if (open && !mounted) setMounted(true)
  if (!open && visible) setVisible(false)

  useEffect(() => {
    if (open) {
      let id2
      const id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setVisible(true))
      })
      return () => { cancelAnimationFrame(id1); if (id2) cancelAnimationFrame(id2) }
    }
    const t = setTimeout(() => setMounted(false), 300)
    return () => clearTimeout(t)
  }, [open])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`
          relative w-full bg-gray-900 border-t border-gray-700 rounded-t-3xl
          px-5 pt-4 pb-22 transition-transform duration-300 ease-out
          ${visible ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5" />
        {children}
      </div>
    </div>
  )
}
