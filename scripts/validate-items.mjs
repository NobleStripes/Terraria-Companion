import fs from 'node:fs'
import path from 'node:path'

const itemsPath = path.resolve(process.cwd(), 'src/data/items.json')

/** @type {Array<any>} */
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'))

const errors = []

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value)

const summonOrWhipIds = new Set([
  42, 43, 44, 45, 46,
  176, 177,
  181, 182, 183, 184, 185, 186, 187, 188, 189,
  193, 194, 196, 197,
])

const magicIds = new Set([36, 37, 38, 39, 40, 41, 150, 180, 192])
const manaAllowedIds = new Set([...summonOrWhipIds, ...magicIds])

const seenIds = new Set()

for (const item of items) {
  if (!isFiniteNumber(item.id)) {
    errors.push(`Item has invalid id: ${JSON.stringify(item)}`)
    continue
  }

  if (seenIds.has(item.id)) {
    errors.push(`Duplicate item id found: ${item.id}`)
  } else {
    seenIds.add(item.id)
  }

  if (item.type === 'weapon' || item.type === 'tool') {
    if (!isFiniteNumber(item.damage)) {
      errors.push(`[${item.id}] ${item.name}: missing/invalid damage for ${item.type}`)
    }
  }

  if (item.type === 'armor') {
    if (!isFiniteNumber(item.defense)) {
      errors.push(`[${item.id}] ${item.name}: missing/invalid defense for armor`)
    }
  }

  if (summonOrWhipIds.has(item.id)) {
    if (item.critChance !== 0) {
      errors.push(`[${item.id}] ${item.name}: critChance must be explicitly 0 for summon/whip items`)
    }
  }

  if (manaAllowedIds.has(item.id)) {
    if (!isFiniteNumber(item.manaCost)) {
      errors.push(`[${item.id}] ${item.name}: manaCost must be explicitly set for magic/summon items`)
    }
  } else if (item.manaCost !== undefined) {
    errors.push(`[${item.id}] ${item.name}: manaCost must be undefined for non-magic/non-summon items`)
  }
}

if (errors.length > 0) {
  console.error('\nItem data validation failed with the following issues:\n')
  for (const err of errors) console.error(`- ${err}`)
  console.error(`\nTotal issues: ${errors.length}`)
  process.exit(1)
}

console.log(`Item data validation passed (${items.length} items checked).`)
