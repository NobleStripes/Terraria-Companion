import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const items = JSON.parse(fs.readFileSync(new URL('../src/data/items.json', import.meta.url), 'utf8'))
const tiers = new Set(['early-game', 'pre-hardmode', 'early-hardmode', 'endgame'])

test('all items include a valid progression tier', () => {
  for (const item of items) {
    assert.ok(tiers.has(item.progressionTier), `Invalid progression tier for ${item.name}`)
  }
})
