import { cn } from '@/lib/cn'
import type { Rarity, ItemType } from '@/types/item'

const rarityColors: Record<Rarity, string> = {
  gray: 'text-[#9e9e9e] border-[#9e9e9e]',
  white: 'text-white border-white',
  blue: 'text-[#2196f3] border-[#2196f3]',
  green: 'text-[#4caf50] border-[#4caf50]',
  orange: 'text-[#ff9800] border-[#ff9800]',
  'light-red': 'text-[#ef5350] border-[#ef5350]',
  pink: 'text-[#f06292] border-[#f06292]',
  'light-purple': 'text-[#ce93d8] border-[#ce93d8]',
  lime: 'text-[#cddc39] border-[#cddc39]',
  yellow: 'text-[#ffeb3b] border-[#ffeb3b]',
  cyan: 'text-[#00bcd4] border-[#00bcd4]',
  red: 'text-[#f44336] border-[#f44336]',
  purple: 'text-[#ab47bc] border-[#ab47bc]',
}

const rarityBorders: Record<Rarity, string> = {
  gray: 'border-[#9e9e9e]',
  white: 'border-white',
  blue: 'border-[#2196f3]',
  green: 'border-[#4caf50]',
  orange: 'border-[#ff9800]',
  'light-red': 'border-[#ef5350]',
  pink: 'border-[#f06292]',
  'light-purple': 'border-[#ce93d8]',
  lime: 'border-[#cddc39]',
  yellow: 'border-[#ffeb3b]',
  cyan: 'border-[#00bcd4]',
  red: 'border-[#f44336]',
  purple: 'border-[#ab47bc]',
}

interface RarityBadgeProps {
  rarity: Rarity
  className?: string
}

export function RarityBadge({ rarity, className }: RarityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold border rounded capitalize',
        rarityColors[rarity],
        className
      )}
    >
      {rarity}
    </span>
  )
}

interface TypeBadgeProps {
  type: ItemType
  className?: string
}

const typeColors: Record<ItemType, string> = {
  weapon: 'text-terra-red border-terra-red',
  armor: 'text-terra-sky border-terra-sky',
  accessory: 'text-terra-gold border-terra-gold',
  material: 'text-gray-400 border-gray-400',
  consumable: 'text-terra-green border-terra-green',
  tool: 'text-[#ff9800] border-[#ff9800]',
  furniture: 'text-[#ce93d8] border-[#ce93d8]',
  misc: 'text-gray-500 border-gray-500',
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold border rounded capitalize',
        typeColors[type],
        className
      )}
    >
      {type}
    </span>
  )
}

export function getRarityBorderClass(rarity: Rarity) {
  return rarityBorders[rarity]
}
