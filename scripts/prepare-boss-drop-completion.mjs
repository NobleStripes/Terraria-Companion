import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd())
const bossesPath = path.join(repoRoot, 'src', 'data', 'bosses.json')
const itemsPath = path.join(repoRoot, 'src', 'data', 'items.json')

const outputDir = path.join(repoRoot, 'outputs', 'boss-drop-completion')
const bossTemplatePath = path.join(outputDir, 'boss-drop-manifest.template.json')
const bossManifestPath = path.join(outputDir, 'boss-drop-manifest.json')
const enemyTemplatePath = path.join(outputDir, 'enemy-drop-manifest.template.json')
const enemyManifestPath = path.join(outputDir, 'enemy-drop-manifest.json')
const workbookPath = path.join(outputDir, 'boss-drop-completion-workbook.md')

const normalize = (value) => String(value ?? '').trim().toLowerCase()
const stopWords = new Set(['of', 'the', 'and'])

function normalizeEnemyKey(value) {
  return normalize(value).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

const ENEMY_CANONICAL_BY_NORMALIZED = new Map([
  ['bat', 'Bats'],
  ['bats', 'Bats'],
  ['cave bat', 'Bats'],
  ['giant bat', 'Bats'],
  ['hellbat', 'Bats'],
  ['ice bat', 'Bats'],
  ['illuminant bat', 'Bats'],
  ['jungle bat', 'Bats'],
  ['lavabat', 'Bats'],
  ['vampire bat', 'Bats'],
  ['crawdads', 'Crawdad'],
  ['giant shellies', 'Giant Shelly'],
  ['pirate captains', 'Pirate Captain'],
  ['pirate invasion enemies', 'Pirate Invasion enemies'],
  ['regular pirates', 'Pirate Invasion enemies'],
  ['salamanders', 'Salamander'],
  ['old ones army enemies', "Old One's Army enemies"],
  ["old one's army enemies", "Old One's Army enemies"],
  ['underground corruption and crimson enemies', 'Underground Corruption/Crimson enemies'],
  ['underground hallow enemies', 'Underground Hallow enemies'],
])

function canonicalizeEnemyName(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) {
    return ''
  }

  const canonical = ENEMY_CANONICAL_BY_NORMALIZED.get(normalizeEnemyKey(trimmed))
  return canonical ?? trimmed
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function uniqueSorted(list) {
  return Array.from(new Set(list.map((value) => String(value).trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function sortByCountThenName(entries) {
  return [...entries].sort((a, b) => {
    if (b.currentCount !== a.currentCount) {
      return b.currentCount - a.currentCount
    }

    return a.name.localeCompare(b.name)
  })
}

function findSuggestions(boss, allItems, currentDrops) {
  const currentKeys = new Set(currentDrops.map(normalize))
  const tokens = boss.name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !stopWords.has(token))

  if (tokens.length === 0) {
    return []
  }

  const scored = []

  for (const itemName of allItems) {
    if (currentKeys.has(normalize(itemName))) {
      continue
    }

    const itemLower = itemName.toLowerCase()
    const tokenHits = tokens.filter((token) => {
      const pattern = new RegExp(`\\b${escapeRegex(token)}\\b`, 'i')
      return pattern.test(itemLower)
    }).length

    const minTokenHits = tokens.length >= 2 ? 2 : 1

    if (tokenHits < minTokenHits) {
      continue
    }

    const trophyOrRelicBoost = /trophy|relic/i.test(itemName) ? 2 : 0
    const score = tokenHits + trophyOrRelicBoost
    scored.push({ itemName, score })
  }

  return scored
    .sort((a, b) => b.score - a.score || a.itemName.localeCompare(b.itemName))
    .slice(0, 8)
    .map((entry) => entry.itemName)
}

function buildTemplate(bosses) {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    notes: [
      'Fill expectedDrops for each boss using authoritative Terraria references.',
      'The template starts from current drops in src/data/bosses.json.',
      'Save your curated file as outputs/boss-drop-completion/boss-drop-manifest.json.',
    ],
    bosses: bosses.map((boss) => ({
      id: boss.id,
      name: boss.name,
      expectedDrops: uniqueSorted(Array.isArray(boss.drops) ? boss.drops : []),
      reviewStatus: 'todo',
      sourceUrl: '',
      notes: '',
    })),
  }
}

function buildEnemyTemplate(enemyEntries) {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    notes: [
      'Fill expectedDropItems for each enemy using authoritative Terraria references.',
      'The template starts from current item.enemyDrops mappings in src/data/items.json.',
      'Save your curated file as outputs/boss-drop-completion/enemy-drop-manifest.json.',
    ],
    enemies: enemyEntries.map((entry) => ({
      name: entry.name,
      expectedDropItems: uniqueSorted(entry.currentDropItems),
      reviewStatus: 'todo',
      sourceUrl: '',
      notes: '',
    })),
  }
}

function buildManifestLookup(manifestData) {
  const map = new Map()

  if (!manifestData || !Array.isArray(manifestData.bosses)) {
    return map
  }

  for (const boss of manifestData.bosses) {
    if (!boss || typeof boss.id !== 'string') {
      continue
    }

    const expectedDrops = Array.isArray(boss.expectedDrops) ? uniqueSorted(boss.expectedDrops) : []
    map.set(boss.id, expectedDrops)
  }

  return map
}

function buildEnemyManifestLookup(manifestData) {
  const map = new Map()

  if (!manifestData || !Array.isArray(manifestData.enemies)) {
    return map
  }

  for (const enemy of manifestData.enemies) {
    if (!enemy || typeof enemy.name !== 'string') {
      continue
    }

    const expectedDropItems = Array.isArray(enemy.expectedDropItems) ? uniqueSorted(enemy.expectedDropItems) : []
    map.set(canonicalizeEnemyName(enemy.name), expectedDropItems)
  }

  return map
}

function buildEnemyEntries(items, bossNameSet) {
  const enemyToItems = new Map()

  for (const item of items) {
    const itemName = String(item?.name ?? '').trim()
    if (!itemName || !Array.isArray(item?.enemyDrops)) {
      continue
    }

    for (const enemyEntry of item.enemyDrops) {
      const enemyName = canonicalizeEnemyName(enemyEntry)
      if (!enemyName) {
        continue
      }

      if (bossNameSet.has(normalize(enemyName))) {
        continue
      }

      const bucket = enemyToItems.get(enemyName) ?? new Set()
      bucket.add(itemName)
      enemyToItems.set(enemyName, bucket)
    }
  }

  const entries = Array.from(enemyToItems.entries()).map(([name, itemNames]) => {
    const currentDropItems = uniqueSorted(Array.from(itemNames))

    return {
      name,
      currentDropItems,
      currentCount: currentDropItems.length,
    }
  })

  return sortByCountThenName(entries)
}

function toChecklist(items) {
  if (items.length === 0) {
    return '- none'
  }

  return items.map((item) => `- [ ] ${item}`).join('\n')
}

async function main() {
  const bosses = JSON.parse(await fs.readFile(bossesPath, 'utf8'))
  const items = JSON.parse(await fs.readFile(itemsPath, 'utf8'))

  const orderedBosses = [...bosses].sort((a, b) => Number(a.order ?? 999) - Number(b.order ?? 999))
  const bossNameSet = new Set(orderedBosses.map((boss) => normalize(boss.name)))
  const enemyEntries = buildEnemyEntries(items, bossNameSet)
  const itemNames = uniqueSorted(items.map((item) => item.name))

  await fs.mkdir(outputDir, { recursive: true })

  const bossTemplate = buildTemplate(orderedBosses)
  await fs.writeFile(bossTemplatePath, `${JSON.stringify(bossTemplate, null, 2)}\n`, 'utf8')

  const enemyTemplate = buildEnemyTemplate(enemyEntries)
  await fs.writeFile(enemyTemplatePath, `${JSON.stringify(enemyTemplate, null, 2)}\n`, 'utf8')

  let bossManifestLookup = new Map()
  let bossManifestFound = false

  try {
    const manifest = JSON.parse(await fs.readFile(bossManifestPath, 'utf8'))
    bossManifestLookup = buildManifestLookup(manifest)
    bossManifestFound = bossManifestLookup.size > 0
  } catch {
    bossManifestLookup = new Map()
  }

  let enemyManifestLookup = new Map()
  let enemyManifestFound = false

  try {
    const manifest = JSON.parse(await fs.readFile(enemyManifestPath, 'utf8'))
    enemyManifestLookup = buildEnemyManifestLookup(manifest)
    enemyManifestFound = enemyManifestLookup.size > 0
  } catch {
    enemyManifestLookup = new Map()
  }

  const lines = []
  lines.push('# Boss And Enemy Drop Completion Workbook')
  lines.push('')
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push('## Goal')
  lines.push('Complete and verify tracked boss drops and enemy item drops from src/data/bosses.json and src/data/items.json.')
  lines.push('')

  if (bossManifestFound) {
    lines.push('Boss manifest status: using outputs/boss-drop-completion/boss-drop-manifest.json for gap checks.')
  } else {
    lines.push('Boss manifest status: not found. Fill outputs/boss-drop-completion/boss-drop-manifest.template.json and save it as boss-drop-manifest.json to enable strict gap checks.')
  }

  if (enemyManifestFound) {
    lines.push('Enemy manifest status: using outputs/boss-drop-completion/enemy-drop-manifest.json for gap checks.')
  } else {
    lines.push('Enemy manifest status: not found. Fill outputs/boss-drop-completion/enemy-drop-manifest.template.json and save it as enemy-drop-manifest.json to enable strict gap checks.')
  }

  lines.push('')
  lines.push('## Boss Progress Summary')
  lines.push('')
  lines.push('| Boss | Current | Expected | Missing | Extra |')
  lines.push('|---|---:|---:|---:|---:|')

  for (const boss of orderedBosses) {
    const current = uniqueSorted(Array.isArray(boss.drops) ? boss.drops : [])
    const expected = bossManifestLookup.get(boss.id) ?? current

    const expectedKeys = new Set(expected.map(normalize))
    const currentKeys = new Set(current.map(normalize))

    const missing = expected.filter((item) => !currentKeys.has(normalize(item)))
    const extra = current.filter((item) => !expectedKeys.has(normalize(item)))

    lines.push(`| ${boss.name} | ${current.length} | ${expected.length} | ${missing.length} | ${extra.length} |`)
  }

  lines.push('')
  lines.push('## Enemy Progress Summary')
  lines.push('')
  lines.push('| Enemy | Current | Expected | Missing | Extra |')
  lines.push('|---|---:|---:|---:|---:|')

  for (const enemy of enemyEntries) {
    const current = enemy.currentDropItems
    const expected = enemyManifestLookup.get(enemy.name) ?? current

    const expectedKeys = new Set(expected.map(normalize))
    const currentKeys = new Set(current.map(normalize))

    const missing = expected.filter((item) => !currentKeys.has(normalize(item)))
    const extra = current.filter((item) => !expectedKeys.has(normalize(item)))

    lines.push(`| ${enemy.name} | ${current.length} | ${expected.length} | ${missing.length} | ${extra.length} |`)
  }

  lines.push('')
  lines.push('## Boss Details')

  for (const boss of orderedBosses) {
    const current = uniqueSorted(Array.isArray(boss.drops) ? boss.drops : [])
    const expected = bossManifestLookup.get(boss.id) ?? current

    const expectedKeys = new Set(expected.map(normalize))
    const currentKeys = new Set(current.map(normalize))

    const missing = expected.filter((item) => !currentKeys.has(normalize(item)))
    const extra = current.filter((item) => !expectedKeys.has(normalize(item)))
    const suggestions = findSuggestions(boss, itemNames, current)

    lines.push('')
    lines.push(`## ${boss.name} (${boss.id})`)
    lines.push('')
    lines.push(`Current drops (${current.length}):`)
    lines.push(toChecklist(current.map((item) => `${item} (present)`)))
    lines.push('')
    lines.push(`Expected missing (${missing.length}):`)
    lines.push(toChecklist(missing))
    lines.push('')
    lines.push(`Possible extras to review (${extra.length}):`)
    lines.push(toChecklist(extra))
    lines.push('')
    lines.push('Suggested related items to evaluate:')
    lines.push(toChecklist(suggestions))
    lines.push('')
    lines.push('Source references:')
    lines.push('- [ ] Terraria Wiki page reviewed')
    lines.push('- [ ] Drops verified for normal/expert/master modes')
    lines.push('- [ ] Added/updated entries in src/data/items.json where needed')
  }

  lines.push('')
  lines.push('## Enemy Details')

  for (const enemy of enemyEntries) {
    const current = enemy.currentDropItems
    const expected = enemyManifestLookup.get(enemy.name) ?? current

    const expectedKeys = new Set(expected.map(normalize))
    const currentKeys = new Set(current.map(normalize))

    const missing = expected.filter((item) => !currentKeys.has(normalize(item)))
    const extra = current.filter((item) => !expectedKeys.has(normalize(item)))

    lines.push('')
    lines.push(`## ${enemy.name}`)
    lines.push('')
    lines.push(`Current item drops (${current.length}):`)
    lines.push(toChecklist(current.map((item) => `${item} (present)`)))
    lines.push('')
    lines.push(`Expected missing (${missing.length}):`)
    lines.push(toChecklist(missing))
    lines.push('')
    lines.push(`Possible extras to review (${extra.length}):`)
    lines.push(toChecklist(extra))
    lines.push('')
    lines.push('Source references:')
    lines.push('- [ ] Terraria Wiki page reviewed')
    lines.push('- [ ] Drop rates and biome/event requirements verified')
    lines.push('- [ ] item.enemyDrops and item.sources text aligned in src/data/items.json')
  }

  await fs.writeFile(workbookPath, `${lines.join('\n')}\n`, 'utf8')

  console.log('Boss and enemy drop completion prep generated:')
  console.log(`- ${path.relative(repoRoot, bossTemplatePath)}`)
  console.log(`- ${path.relative(repoRoot, enemyTemplatePath)}`)
  console.log(`- ${path.relative(repoRoot, workbookPath)}`)
  if (!bossManifestFound) {
    console.log('- Optional next step: copy boss-drop-manifest.template.json to boss-drop-manifest.json and curate expectedDrops.')
  }
  if (!enemyManifestFound) {
    console.log('- Optional next step: copy enemy-drop-manifest.template.json to enemy-drop-manifest.json and curate expectedDropItems.')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
