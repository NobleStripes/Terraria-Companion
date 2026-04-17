import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const bosses = JSON.parse(fs.readFileSync(new URL('../src/data/bosses.json', import.meta.url), 'utf8'))
const items = JSON.parse(fs.readFileSync(new URL('../src/data/items.json', import.meta.url), 'utf8'))
const itemIds = new Set(items.map((item) => item.id))

test('every boss gear item id exists in item catalog', () => {
  for (const boss of bosses) {
    for (const gear of boss.recommendedGear) {
      for (const id of [...gear.armor, ...gear.weapons, ...gear.accessories]) {
        assert.ok(itemIds.has(id), `${boss.id} references missing item id ${id}`)
      }
    }
  }
})
