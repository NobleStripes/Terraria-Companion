import type { Rarity } from '@/types/item'

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

export function getRarityBorderClass(rarity: Rarity) {
  return rarityBorders[rarity]
}
