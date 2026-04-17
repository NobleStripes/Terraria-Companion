import { useState, useEffect } from 'react'
import type { FuseResult } from 'fuse.js'
import type { Item, ItemType } from '@/types/item'
import { searchItems } from '@/lib/search'
import { items } from '@/data/index'

interface UseItemSearchOptions {
  types?: ItemType[]
  debounceMs?: number
}

export function useItemSearch(query: string, options: UseItemSearchOptions = {}) {
  const { types, debounceMs = 150 } = options
  const [results, setResults] = useState<FuseResult<Item>[]>([])

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      setResults(searchItems(query.trim(), types))
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [query, types, debounceMs])

  return results
}

export function useAllItems(types?: ItemType[]) {
  if (!types || types.length === 0) return items
  return items.filter((item) => types.includes(item.type))
}
