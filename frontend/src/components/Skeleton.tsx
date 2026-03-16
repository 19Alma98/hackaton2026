interface SkeletonProps {
  readonly className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-white/10 rounded-2xl ${className ?? ''}`} />
  )
}
