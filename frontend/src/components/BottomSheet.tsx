import { useEffect, type ReactNode } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed bottom-0 inset-x-0 glass-card rounded-t-2xl p-6 z-50">
        {title !== undefined && (
          <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
        )}
        {children}
      </div>
    </>
  )
}
