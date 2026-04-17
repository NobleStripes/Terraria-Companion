import { cn } from '@/lib/cn'
import { RarityBadge, TypeBadge, getRarityBorderClass } from './Badge'
import type { Item } from '@/types/item'
import type { ReactNode } from 'react'

interface ItemCardProps {
  item: Item
  selected?: boolean
  onClick?: () => void
  compact?: boolean
  prefixLabel?: string
  rightAction?: ReactNode
}

export function ItemCard({ item, selected, onClick, compact, prefixLabel, rightAction }: ItemCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border px-3 py-2 transition-colors duration-150 focus:outline-none',
        selected
          ? 'bg-terra-panel border-terra-gold'
          : 'bg-terra-surface border-terra-border hover:border-terra-gold hover:bg-terra-panel',
        getRarityBorderClass(item.rarity),
        selected && 'border-terra-gold'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm text-white truncate">{item.name}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {rightAction}
          {!compact && (
            <>
            {prefixLabel && (
              <span className="text-[10px] leading-none px-1.5 py-1 rounded border border-terra-gold/70 bg-terra-bg text-terra-gold font-pixel">
                {prefixLabel}
              </span>
            )}
            <RarityBadge rarity={item.rarity} className="shrink-0" />
            </>
          )}
        </div>
      </div>
      {!compact && (
        <div className="flex items-center gap-1 mt-1">
          <TypeBadge type={item.type} />
        </div>
      )}
    </button>
  )
}
