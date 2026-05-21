import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = path.resolve(process.cwd())

const bossesPath = path.join(repoRoot, 'src', 'data', 'bosses.json')
const itemsPath = path.join(repoRoot, 'src', 'data', 'items.json')

const outputDir = path.join(repoRoot, 'outputs', 'boss-drop-completion')
const bossManifestPath = path.join(outputDir, 'boss-drop-manifest.json')
const enemyManifestPath = path.join(outputDir, 'enemy-drop-manifest.json')
const previewPath = path.join(outputDir, 'database-update-preview.json')

const shouldWrite = process.argv.includes('--write')

function normalize(value) {
  return String(value ?? '').trim().toLowerCase()
}

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
  ["old one's army enemies during the event", "Old One's Army enemies"],
  ['corruption and crimson enemies', 'Underground Corruption/Crimson enemies'],
  ['enemies in or near the underworld', 'Underworld enemies'],
  ['enemies in the jungle and underground jungle', 'Jungle and Underground Jungle enemies'],
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

function uniquePreserveOrder(list) {
  const seen = new Set()
  const out = []

  for (const raw of list) {
    const value = String(raw ?? '').trim()
    if (!value) {
      continue
    }

    const key = normalize(value)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    out.push(value)
  }

  return out
}

function uniqueEnemyNames(list) {
  return uniquePreserveOrder(
    list
      .map((value) => canonicalizeEnemyName(value))
      .filter(Boolean),
  )
}

function equalsStringArray(a, b) {
  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}

function equalsNormalizedSet(a, b) {
  const aSet = new Set(a.map(normalize))
  const bSet = new Set(b.map(normalize))

  if (aSet.size !== bSet.size) {
    return false
  }

  for (const value of aSet) {
    if (!bSet.has(value)) {
      return false
    }
  }

  return true
}

function buildItemNameLookup(items) {
  const map = new Map()

  for (const item of items) {
    const itemName = String(item?.name ?? '').trim()
    if (!itemName) {
      continue
    }

    map.set(normalize(itemName), itemName)
  }

  return map
}

async function readJson(filePath, label) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`${label} missing or invalid JSON: ${path.relative(repoRoot, filePath)}\n${String(error)}`)
  }
}

async function main() {
  const bosses = await readJson(bossesPath, 'Boss data')
  const items = await readJson(itemsPath, 'Item data')
  const bossManifest = await readJson(bossManifestPath, 'Boss manifest')
  const enemyManifest = await readJson(enemyManifestPath, 'Enemy manifest')

  if (!Array.isArray(bosses)) {
    throw new Error('Boss data should be an array')
  }

  if (!Array.isArray(items)) {
    throw new Error('Item data should be an array')
  }

  if (!bossManifest || !Array.isArray(bossManifest.bosses)) {
    throw new Error('Boss manifest must include a bosses array')
  }

  if (!enemyManifest || !Array.isArray(enemyManifest.enemies)) {
    throw new Error('Enemy manifest must include an enemies array')
  }

  const bossById = new Map(bosses.map((boss) => [String(boss?.id ?? ''), boss]))
  const itemNameLookup = buildItemNameLookup(items)

  const errors = []

  const bossExpectedById = new Map()
  for (const entry of bossManifest.bosses) {
    const id = String(entry?.id ?? '').trim()
    if (!id) {
      errors.push('Boss manifest entry missing id')
      continue
    }

    if (!bossById.has(id)) {
      errors.push(`Boss manifest references unknown boss id: ${id}`)
      continue
    }

    const expectedDrops = uniquePreserveOrder(Array.isArray(entry.expectedDrops) ? entry.expectedDrops : [])
    for (const drop of expectedDrops) {
      if (!itemNameLookup.has(normalize(drop))) {
        errors.push(`Boss manifest [${id}] expected drop not found in items.json: ${drop}`)
      }
    }

    bossExpectedById.set(id, expectedDrops)
  }

  const expectedEnemiesByItemName = new Map()
  for (const entry of enemyManifest.enemies) {
    const enemyName = canonicalizeEnemyName(entry?.name)
    if (!enemyName) {
      errors.push('Enemy manifest entry missing name')
      continue
    }

    const expectedDropItems = uniquePreserveOrder(Array.isArray(entry.expectedDropItems) ? entry.expectedDropItems : [])
    for (const itemNameRaw of expectedDropItems) {
      const key = normalize(itemNameRaw)
      const canonicalItemName = itemNameLookup.get(key)
      if (!canonicalItemName) {
        errors.push(`Enemy manifest [${enemyName}] references unknown item: ${itemNameRaw}`)
        continue
      }

      const bucket = expectedEnemiesByItemName.get(canonicalItemName) ?? new Set()
      bucket.add(enemyName)
      expectedEnemiesByItemName.set(canonicalItemName, bucket)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Manifest validation failed with ${errors.length} issue(s):\n- ${errors.join('\n- ')}`)
  }

  const updatedBosses = []
  const bossChanges = []
  for (const boss of bosses) {
    const id = String(boss?.id ?? '')
    const currentDrops = uniquePreserveOrder(Array.isArray(boss?.drops) ? boss.drops : [])
    const manifestDrops = bossExpectedById.get(id) ?? currentDrops
    const nextDrops = equalsNormalizedSet(currentDrops, manifestDrops) ? currentDrops : manifestDrops

    const changed = !equalsStringArray(currentDrops, nextDrops)
    if (changed) {
      bossChanges.push({
        id,
        name: String(boss?.name ?? id),
        beforeCount: currentDrops.length,
        afterCount: nextDrops.length,
      })
    }

    updatedBosses.push({
      ...boss,
      drops: nextDrops,
    })
  }

  const updatedItems = []
  const enemyChanges = []
  for (const item of items) {
    const itemName = String(item?.name ?? '').trim()
    if (!itemName) {
      updatedItems.push(item)
      continue
    }

    if (!expectedEnemiesByItemName.has(itemName)) {
      updatedItems.push(item)
      continue
    }

    const currentEnemies = uniqueEnemyNames(Array.isArray(item.enemyDrops) ? item.enemyDrops : [])
    const manifestEnemies = Array.from(expectedEnemiesByItemName.get(itemName)).sort((a, b) => a.localeCompare(b))
    const nextEnemies = equalsNormalizedSet(currentEnemies, manifestEnemies) ? currentEnemies : manifestEnemies

    const changed = !equalsStringArray(currentEnemies, nextEnemies)
    if (changed) {
      enemyChanges.push({
        itemId: item.id,
        itemName,
        beforeCount: currentEnemies.length,
        afterCount: nextEnemies.length,
      })
    }

    updatedItems.push({
      ...item,
      enemyDrops: nextEnemies,
    })
  }

  await fs.mkdir(outputDir, { recursive: true })

  const preview = {
    generatedAt: new Date().toISOString(),
    writeMode: shouldWrite,
    summary: {
      bossesChanged: bossChanges.length,
      itemsEnemyDropsChanged: enemyChanges.length,
    },
    bossChanges,
    enemyChanges,
  }

  await fs.writeFile(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8')

  if (shouldWrite) {
    await fs.writeFile(bossesPath, `${JSON.stringify(updatedBosses, null, 2)}\n`, 'utf8')
    await fs.writeFile(itemsPath, `${JSON.stringify(updatedItems, null, 2)}\n`, 'utf8')
  }

  console.log(shouldWrite ? 'Drop manifests applied to data files.' : 'Drop manifest stage completed (dry-run).')
  console.log(`Preview: ${path.relative(repoRoot, previewPath)}`)
  console.log(`Boss changes: ${bossChanges.length}`)
  console.log(`Item enemyDrop changes: ${enemyChanges.length}`)
  if (!shouldWrite) {
    console.log('Run with --write to apply changes into src/data.')
  }
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
