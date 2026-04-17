import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number
  max: number
  className?: string
  showLabel?: boolean
}

export function ProgressBar({ value, max, className, showLabel = true }: ProgressBarProps) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100)

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>{value} / {max} defeated</span>
          <span>{percent}%</span>
        </div>
      )}
      <div className="h-2.5 bg-terra-bg rounded-full border border-terra-border overflow-hidden">
        <div
          className="h-full bg-terra-gold rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
