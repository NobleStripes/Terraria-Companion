import test from 'node:test'
import assert from 'node:assert/strict'
import { getItemSourceCategory, getItemSourceFacets, normalizeSourceFacet } from '../src/lib/itemSources.ts'
import type { Item } from '../src/types/item.ts'

function makeItem(sources: string[]): Item {
  return {
    id: 999001,
    name: 'Test Item',
    type: 'material',
    rarity: 'white',
    tooltip: 'test',
    sources,
  }
}

test('normalizeSourceFacet trims spacing and normalizes separators', () => {
  assert.equal(normalizeSourceFacet('  Sold   by-  Traveling Merchant  '), 'Sold by: Traveling Merchant')
  assert.equal(normalizeSourceFacet('Found in :  Surface Chest'), 'Found in: Surface Chest')
})

test('getItemSourceFacets normalizes entries and drops blanks', () => {
  const facets = getItemSourceFacets(makeItem(['  Sold by- NPC  ', '   ', 'Dropped by : Eye of Cthulhu']))
  assert.deepEqual(facets, ['Sold by: NPC', 'Dropped by: Eye of Cthulhu'])
})

test('getItemSourceCategory uses deterministic precedence', () => {
  assert.equal(getItemSourceCategory(makeItem(['Crafted at Iron Anvil', 'Dropped by boss'])), 'crafted')
  assert.equal(getItemSourceCategory(makeItem(['Sold by Merchant', 'Event reward'])), 'vendor')
  assert.equal(getItemSourceCategory(makeItem(['Event: Pumpkin Moon'])), 'event')
  assert.equal(getItemSourceCategory(makeItem(['Dropped by Skeletron'])), 'drop')
  assert.equal(getItemSourceCategory(makeItem(['World generation'])), 'exploration')
})
