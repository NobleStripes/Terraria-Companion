import { useDeferredValue, useMemo } from 'react'
import type { FuseResult } from 'fuse.js'
import type { Item, ItemType } from '@/types/item'
import { searchItems } from '@/lib/search'
import { items } from '@/data/index'

interface UseItemSearchOptions {
  types?: ItemType[]
  debounceMs?: number
}

export function useItemSearch(query: string, options: UseItemSearchOptions = {}) {
  const { types } = options
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim()

  return useMemo<FuseResult<Item>[]>(() => {
    if (normalizedQuery.length < 2) return []
    return searchItems(normalizedQuery, types)
  }, [normalizedQuery, types])
}

export function useAllItems(types?: ItemType[]) {
  if (!types || types.length === 0) return items
  return items.filter((item) => types.includes(item.type))
}
