import { prefixes } from '@/data/index'
import type { Item } from '@/types/item'
import type { Prefix } from '@/types/prefix'
import { canApplyPrefix } from '@/lib/prefixes'

export function usePrefixesForItem(item: Item | undefined): Prefix[] {
  if (!item) return []
  return prefixes.filter((prefix) => canApplyPrefix(item, prefix))
}
