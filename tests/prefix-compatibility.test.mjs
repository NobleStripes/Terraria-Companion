import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const items = JSON.parse(fs.readFileSync(new URL('../src/data/items.json', import.meta.url), 'utf8'))
const prefixes = JSON.parse(fs.readFileSync(new URL('../src/data/prefixes.json', import.meta.url), 'utf8'))
const prefixById = new Map(prefixes.map((prefix) => [prefix.id, prefix]))

test('alternatePrefixes only reference valid compatible prefixes', () => {
  for (const item of items) {
    if (!Array.isArray(item.alternatePrefixes)) continue

    for (const prefixId of item.alternatePrefixes) {
      const prefix = prefixById.get(prefixId)
      assert.ok(prefix, `${item.name} has unknown prefix ${prefixId}`)
      assert.ok(prefix.appliesTo.includes(item.type), `${item.name} cannot use prefix ${prefixId}`)
    }
  }
})
