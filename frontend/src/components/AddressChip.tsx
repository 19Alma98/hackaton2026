import { useState, useCallback } from 'react'
import { shortAddress } from '@/utils/format'

interface AddressChipProps {
  address: string
  className?: string
}

export function AddressChip({ address, className = '' }: AddressChipProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // silently ignore clipboard errors
    })
  }, [address])

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1 font-mono text-sm text-slate-300 hover:text-white transition-colors ${className}`}
      title={address}
    >
      <span>{copied ? 'Copiato!' : shortAddress(address)}</span>
    </button>
  )
}
