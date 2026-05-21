import fs from 'node:fs'
import path from 'node:path'

const bossesPath = path.resolve(process.cwd(), 'src/data/bosses.json')
const itemsPath = path.resolve(process.cwd(), 'src/data/items.json')

/** @type {Array<any>} */
const bosses = JSON.parse(fs.readFileSync(bossesPath, 'utf8'))
/** @type {Array<any>} */
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'))

const normalize = (name) => String(name ?? '').trim().toLowerCase()
const itemNamesByLower = new Set(items.map((item) => normalize(item.name)).filter(Boolean))
const itemNamesOriginal = items.map((item) => String(item.name ?? '')).filter(Boolean)

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  const prev = new Array(b.length + 1)
  const curr = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j += 1) prev[j] = j
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j]
  }
  return prev[b.length]
}

function closestItemName(needle) {
  const target = normalize(needle)
  let best = ''
  let bestDistance = Infinity
  for (const candidate of itemNamesOriginal) {
    const distance = levenshtein(target, normalize(candidate))
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }
  return bestDistance <= Math.max(2, Math.floor(target.length / 4)) ? best : ''
}

const errors = []
let totalDrops = 0

for (const boss of bosses) {
  if (!boss || typeof boss.id !== 'string') {
    errors.push(`Boss has invalid id: ${JSON.stringify(boss)}`)
    continue
  }

  if (!Array.isArray(boss.drops)) {
    errors.push(`[${boss.id}] drops field is missing or not an array`)
    continue
  }

  const seenInBoss = new Set()

  for (const drop of boss.drops) {
    totalDrops += 1
    const trimmed = String(drop ?? '').trim()

    if (!trimmed) {
      errors.push(`[${boss.id}] empty drop entry`)
      continue
    }

    const key = normalize(trimmed)

    if (seenInBoss.has(key)) {
      errors.push(`[${boss.id}] duplicate drop entry: "${trimmed}"`)
    } else {
      seenInBoss.add(key)
    }

    if (!itemNamesByLower.has(key)) {
      const hint = closestItemName(trimmed)
      const suffix = hint ? ` (did you mean "${hint}"?)` : ''
      errors.push(`[${boss.id}] drop "${trimmed}" does not match any item in items.json${suffix}`)
    }
  }
}

if (errors.length > 0) {
  console.error('\nBoss data validation failed with the following issues:\n')
  for (const err of errors) console.error(`- ${err}`)
  console.error(`\nTotal issues: ${errors.length}`)
  process.exit(1)
}

console.log(`Boss data validation passed (${bosses.length} bosses, ${totalDrops} drops checked).`)
