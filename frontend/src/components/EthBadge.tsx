import { formatEth } from '@/utils/format'

interface EthBadgeProps {
  weiValue: string
  size?: 'sm' | 'lg'
  className?: string
}

export function EthBadge({ weiValue, size = 'sm', className = '' }: EthBadgeProps) {
  const sizeClasses =
    size === 'lg'
      ? 'text-2xl font-bold text-white'
      : 'text-sm text-slate-300'

  return (
    <span className={`font-mono ${sizeClasses} ${className}`}>
      {formatEth(weiValue)}
    </span>
  )
}
