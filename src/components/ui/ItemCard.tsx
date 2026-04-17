import { cn } from '@/lib/cn'
import { RarityBadge, TypeBadge, getRarityBorderClass } from './Badge'
import type { Item } from '@/types/item'

interface ItemCardProps {
  item: Item
  selected?: boolean
  onClick?: () => void
  compact?: boolean
}

export function ItemCard({ item, selected, onClick, compact }: ItemCardProps) {
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
        {!compact && <RarityBadge rarity={item.rarity} className="shrink-0" />}
      </div>
      {!compact && (
        <div className="flex items-center gap-1 mt-1">
          <TypeBadge type={item.type} />
        </div>
      )}
    </button>
  )
}
