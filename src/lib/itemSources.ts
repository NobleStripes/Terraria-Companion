import type { Item } from '@/types/item'

export type SourceCategory = 'all' | 'crafted' | 'drop' | 'vendor' | 'event' | 'exploration'

export function getItemSourceCategory(item: Item): Exclude<SourceCategory, 'all'> {
  const sourceText = item.sources.join(' ').toLowerCase()

  if (/(craft|anvil|work bench|station)/.test(sourceText)) return 'crafted'
  if (/(merchant|npc|sold by|vendor|traveling)/.test(sourceText)) return 'vendor'
  if (/(event|invasion|moon|pumpkin|frost)/.test(sourceText)) return 'event'
  if (/(drop|boss|enemy|found in|obtained from)/.test(sourceText)) return 'drop'
  return 'exploration'
}

export function normalizeSourceFacet(source: string): string {
  return source
    .replace(/\s+/g, ' ')
    .replace(/\s*[-:]\s*/g, ': ')
    .trim()
}

export function getItemSourceFacets(item: Item): string[] {
  return item.sources
    .map((entry) => normalizeSourceFacet(entry))
    .filter(Boolean)
}
