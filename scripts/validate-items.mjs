import fs from 'node:fs'
import path from 'node:path'

const itemsPath = path.resolve(process.cwd(), 'src/data/items.json')
const prefixesPath = path.resolve(process.cwd(), 'src/data/prefixes.json')

/** @type {Array<any>} */
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'))
/** @type {Array<any>} */
const prefixes = JSON.parse(fs.readFileSync(prefixesPath, 'utf8'))

const errors = []
const MIGRATION_PLACEHOLDER_TAG = 'Migration: Boss Gear Placeholder'
const LEGACY_MIGRATION_TAG = 'Boss strategy recommendation'

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value)
const isFinitePositiveNumber = (value) => isFiniteNumber(value) && value > 0

const prefixById = new Map(prefixes.map((prefix) => [prefix.id, prefix]))

const explicitStatExemptIds = new Set([
  167, // Grappling Hook
  168, // Magic Mirror
  169, // Ice Mirror
])

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

    if (!explicitStatExemptIds.has(item.id)) {
      if (!isFiniteNumber(item.useTime)) {
        errors.push(`[${item.id}] ${item.name}: missing/invalid useTime for ${item.type}; add explicit exemption if intended`)
      }

      if (!isFiniteNumber(item.knockback)) {
        errors.push(`[${item.id}] ${item.name}: missing/invalid knockback for ${item.type}; add explicit exemption if intended`)
      }
    }
  }

  if (item.type === 'armor') {
    if (!isFiniteNumber(item.defense)) {
      errors.push(`[${item.id}] ${item.name}: missing/invalid defense for armor`)
    }
  }

  if (item.type === 'tool') {
    const lowerName = String(item.name).toLowerCase()

    const needsPickaxePower =
      lowerName.includes('pickaxe') ||
      lowerName.includes('drill') ||
      lowerName.includes('drax') ||
      lowerName.includes('picksaw') ||
      item.pickaxePower !== undefined

    const needsAxePower =
      ((/(^|[^a-z])axe([^a-z]|$)/.test(lowerName) || lowerName.endsWith(' axe')) && !lowerName.includes('pickaxe')) ||
      lowerName.includes('chainsaw') ||
      lowerName.includes('hamaxe') ||
      lowerName.includes('drax') ||
      lowerName.includes('picksaw') ||
      item.axePower !== undefined

    const needsHammerPower =
      lowerName.includes('hammer') ||
      lowerName.includes('pwnhammer') ||
      lowerName.includes('hamaxe') ||
      item.hammerPower !== undefined

    if (needsPickaxePower && !isFinitePositiveNumber(item.pickaxePower)) {
      errors.push(`[${item.id}] ${item.name}: tool requires valid pickaxePower`)
    }

    if (needsAxePower && !isFinitePositiveNumber(item.axePower)) {
      errors.push(`[${item.id}] ${item.name}: tool requires valid axePower`)
    }

    if (needsHammerPower && !isFinitePositiveNumber(item.hammerPower)) {
      errors.push(`[${item.id}] ${item.name}: tool requires valid hammerPower`)
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

  if (item.alternatePrefixes !== undefined) {
    if (!Array.isArray(item.alternatePrefixes)) {
      errors.push(`[${item.id}] ${item.name}: alternatePrefixes must be an array when provided`)
    } else {
      for (const prefixId of item.alternatePrefixes) {
        if (typeof prefixId !== 'string') {
          errors.push(`[${item.id}] ${item.name}: alternatePrefixes entries must be string IDs`)
          continue
        }

        const prefix = prefixById.get(prefixId)
        if (!prefix) {
          errors.push(`[${item.id}] ${item.name}: unknown alternate prefix '${prefixId}'`)
          continue
        }

        if (!['weapon', 'tool', 'accessory'].includes(item.type)) {
          errors.push(`[${item.id}] ${item.name}: alternatePrefixes only allowed on weapon/tool/accessory items`)
          continue
        }

        if (!prefix.appliesTo.includes(item.type)) {
          errors.push(`[${item.id}] ${item.name}: alternate prefix '${prefixId}' is not valid for item type '${item.type}'`)
        }
      }
    }
  }

  const sources = Array.isArray(item.sources) ? item.sources : []
  const hasMigrationTag = sources.includes(MIGRATION_PLACEHOLDER_TAG)
  const hasLegacyMigrationTag = sources.includes(LEGACY_MIGRATION_TAG)
  const isMigrationPlaceholder = item.tooltip === 'Boss recommendation entry.'

  if (hasLegacyMigrationTag) {
    errors.push(`[${item.id}] ${item.name}: uses legacy migration source tag '${LEGACY_MIGRATION_TAG}'`)
  }

  if (isMigrationPlaceholder && !hasMigrationTag) {
    errors.push(`[${item.id}] ${item.name}: placeholder item must include source tag '${MIGRATION_PLACEHOLDER_TAG}'`)
  }

  if (hasMigrationTag && !isMigrationPlaceholder) {
    errors.push(`[${item.id}] ${item.name}: migration source tag '${MIGRATION_PLACEHOLDER_TAG}' is reserved for placeholder entries`)
  }
}

if (errors.length > 0) {
  console.error('\nItem data validation failed with the following issues:\n')
  for (const err of errors) console.error(`- ${err}`)
  console.error(`\nTotal issues: ${errors.length}`)
  process.exit(1)
}

console.log(`Item data validation passed (${items.length} items checked).`)
