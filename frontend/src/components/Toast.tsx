interface ToastProps {
  message: string
  type: 'success' | 'error'
  visible: boolean
  onDismiss: () => void
}

export function Toast({ message, type, visible, onDismiss }: ToastProps) {
  if (!visible) return null

  const textColor = type === 'success' ? 'text-emerald-400' : 'text-rose-400'

  return (
    <div
      onClick={onDismiss}
      className={`fixed top-4 right-4 z-50 glass-card px-4 py-3 cursor-pointer ${textColor}`}
      role="alert"
    >
      {message}
    </div>
  )
}
