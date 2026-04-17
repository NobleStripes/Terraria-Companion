import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js'
import type { Item, ItemType } from '@/types/item'
import { items } from '@/data/index'

const fuseOptions: IFuseOptions<Item> = {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'tooltip', weight: 0.2 },
    { name: 'sources', weight: 0.1 },
  ],
  threshold: 0.35,
  minMatchCharLength: 2,
  includeScore: true,
  includeMatches: true,
}

const fuseInstance = new Fuse(items, fuseOptions)

export function searchItems(query: string, types?: ItemType[]): FuseResult<Item>[] {
  if (!query || query.length < 2) return []
  const results = fuseInstance.search(query)
  if (!types || types.length === 0) return results
  return results.filter((r) => types.includes(r.item.type))
}
