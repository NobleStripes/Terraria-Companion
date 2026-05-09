import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const bosses = JSON.parse(fs.readFileSync(new URL('../src/data/bosses.json', import.meta.url), 'utf8'))
const items = JSON.parse(fs.readFileSync(new URL('../src/data/items.json', import.meta.url), 'utf8'))
const placeholderSource = 'Curated boss progression recommendation set'
const placeholderTooltipPrefix = 'Curated progression recommendation for '
const itemsById = new Map(items.map((item) => [item.id, item]))

test('every boss gear item id exists in item catalog', () => {
  for (const boss of bosses) {
    for (const gear of boss.recommendedGear) {
      for (const id of [...gear.armor, ...gear.weapons, ...gear.accessories]) {
        assert.ok(itemsById.has(id), `${boss.id} references missing item id ${id}`)
      }
    }
  }
})

test('boss gear item ids do not point at curated placeholder entries', () => {
  for (const boss of bosses) {
    for (const gear of boss.recommendedGear) {
      for (const id of [...gear.armor, ...gear.weapons, ...gear.accessories]) {
        const item = itemsById.get(id)
        assert.ok(item, `${boss.id} references missing item id ${id}`)
        assert.ok(
          !item.sources?.includes(placeholderSource),
          `${boss.id} references curated placeholder item ${id} (${item.name})`
        )
        assert.ok(
          !item.tooltip?.startsWith(placeholderTooltipPrefix),
          `${boss.id} references curated placeholder tooltip item ${id} (${item.name})`
        )
      }
    }
  }
})
