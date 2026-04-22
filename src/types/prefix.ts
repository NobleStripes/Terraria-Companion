import type { ItemType } from '@/types/item'

export type PrefixAppliesTo = Extract<ItemType, 'weapon' | 'tool' | 'accessory'>

export interface PrefixModifiers {
  damagePct?: number
  defense?: number
  critChance?: number
  knockbackPct?: number
  useSpeedPct?: number
  manaCostPct?: number
  velocityPct?: number
  sizePct?: number
  movementSpeedPct?: number
  meleeSpeedPct?: number
  maxMana?: number
}

export interface Prefix {
  id: string
  name: string
  appliesTo: PrefixAppliesTo[]
  weaponCategories?: Array<'melee-swing' | 'ranged' | 'magic' | 'summon' | 'tool'>
  tooltip: string
  modifiers: PrefixModifiers
}
