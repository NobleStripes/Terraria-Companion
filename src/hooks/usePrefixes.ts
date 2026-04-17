import { prefixes } from '@/data/index'
import type { Item } from '@/types/item'
import type { Prefix } from '@/types/prefix'

export function usePrefixesForItem(item: Item | undefined): Prefix[] {
  if (!item) return []
  return prefixes.filter((prefix) => prefix.appliesTo.includes(item.type as Prefix['appliesTo'][number]))
}
