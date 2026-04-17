export type ItemType =
  | 'weapon'
  | 'armor'
  | 'accessory'
  | 'material'
  | 'consumable'
  | 'tool'
  | 'furniture'
  | 'misc'

export type Rarity =
  | 'gray'
  | 'white'
  | 'blue'
  | 'green'
  | 'orange'
  | 'light-red'
  | 'pink'
  | 'light-purple'
  | 'lime'
  | 'yellow'
  | 'cyan'
  | 'red'
  | 'purple'

export interface Item {
  id: number
  name: string
  type: ItemType
  rarity: Rarity
  tooltip: string
  sources: string[]
  wikiSlug?: string
  // Stats (optional, depending on item type)
  damage?: number
  defense?: number
  speed?: number
  knockback?: number
  critChance?: number
  useTime?: number
  manaCost?: number
}
