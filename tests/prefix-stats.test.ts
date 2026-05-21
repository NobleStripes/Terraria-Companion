import test from 'node:test'
import assert from 'node:assert/strict'
import { canApplyPrefix, applyPrefixToItemStats } from '../src/lib/prefixes.ts'
import type { Item } from '../src/types/item.ts'
import type { Prefix } from '../src/types/prefix.ts'

function makeWeapon(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    name: 'Iron Sword',
    type: 'weapon',
    rarity: 'white',
    tooltip: 'A sword.',
    sources: [],
    damage: 20,
    knockback: 5,
    critChance: 4,
    useTime: 25,
    ...overrides,
  }
}

function makePrefix(overrides: Partial<Prefix> = {}): Prefix {
  return {
    id: 'test',
    name: 'Test',
    appliesTo: ['weapon'],
    tooltip: '',
    modifiers: {},
    ...overrides,
  }
}

// --- canApplyPrefix ---

test('canApplyPrefix: returns false when item type is not in appliesTo', () => {
  const armor = makeWeapon({ type: 'armor' })
  const prefix = makePrefix({ appliesTo: ['weapon'] })
  assert.equal(canApplyPrefix(armor as Item, prefix), false)
})

test('canApplyPrefix: returns true for a universal prefix with no weaponCategories restriction', () => {
  const sword = makeWeapon()
  const prefix = makePrefix({ weaponCategories: undefined })
  assert.equal(canApplyPrefix(sword, prefix), true)
})

test('canApplyPrefix: returns true for a universal prefix with empty weaponCategories', () => {
  const sword = makeWeapon()
  const prefix = makePrefix({ weaponCategories: [] })
  assert.equal(canApplyPrefix(sword, prefix), true)
})

test('canApplyPrefix: returns true when weapon category matches prefix restriction', () => {
  const bow = makeWeapon({ name: 'Wooden Bow' })
  const rangedPrefix = makePrefix({ weaponCategories: ['ranged'] })
  assert.equal(canApplyPrefix(bow, rangedPrefix), true)
})

test('canApplyPrefix: returns false when weapon category does not match prefix restriction', () => {
  const sword = makeWeapon({ name: 'Iron Sword' })
  const rangedPrefix = makePrefix({ weaponCategories: ['ranged'] })
  assert.equal(canApplyPrefix(sword, rangedPrefix), false)
})

test('canApplyPrefix: returns false for magic-exclusive prefix on a melee weapon', () => {
  const sword = makeWeapon({ name: 'Excalibur' })
  const magicPrefix = makePrefix({ weaponCategories: ['magic'] })
  assert.equal(canApplyPrefix(sword, magicPrefix), false)
})

test('canApplyPrefix: yoyo accepts a universal prefix (no weaponCategories restriction)', () => {
  const yoyo = makeWeapon({ name: 'Cascade Yoyo' })
  const universal = makePrefix({ weaponCategories: undefined })
  assert.equal(canApplyPrefix(yoyo, universal), true)
})

test('canApplyPrefix: yoyo rejects a melee-swing restricted prefix', () => {
  const yoyo = makeWeapon({ name: 'Cascade Yoyo' })
  const meleeOnly = makePrefix({ weaponCategories: ['melee-swing'] })
  assert.equal(canApplyPrefix(yoyo, meleeOnly), false)
})

test('canApplyPrefix: terrarian accepts a universal prefix', () => {
  const terrarian = makeWeapon({ name: 'Terrarian' })
  const universal = makePrefix({ weaponCategories: undefined })
  assert.equal(canApplyPrefix(terrarian, universal), true)
})

test('canApplyPrefix: terrarian rejects a melee-swing restricted prefix', () => {
  const terrarian = makeWeapon({ name: 'Terrarian' })
  const meleeOnly = makePrefix({ weaponCategories: ['melee-swing'] })
  assert.equal(canApplyPrefix(terrarian, meleeOnly), false)
})

test('canApplyPrefix: whip classified as melee-swing — accepts melee-swing prefix', () => {
  const whip = makeWeapon({ name: 'Firecracker Whip' })
  const meleePrefix = makePrefix({ weaponCategories: ['melee-swing'] })
  assert.equal(canApplyPrefix(whip, meleePrefix), true)
})

test('canApplyPrefix: whip does not accept ranged-exclusive prefix', () => {
  const whip = makeWeapon({ name: 'Firecracker Whip' })
  const rangedPrefix = makePrefix({ weaponCategories: ['ranged'] })
  assert.equal(canApplyPrefix(whip, rangedPrefix), false)
})

test('canApplyPrefix: summon weapon (critChance=0, manaCost>0) accepts summon prefix', () => {
  const summon = makeWeapon({ name: 'Slime Staff', critChance: 0, manaCost: 10, damage: 8 })
  const summonPrefix = makePrefix({ weaponCategories: ['summon'] })
  assert.equal(canApplyPrefix(summon, summonPrefix), true)
})

test('canApplyPrefix: magic weapon (manaCost>0, critChance>0) does not accept summon prefix', () => {
  const magic = makeWeapon({ name: 'Space Gun', critChance: 4, manaCost: 7, damage: 15 })
  const summonPrefix = makePrefix({ weaponCategories: ['summon'] })
  assert.equal(canApplyPrefix(magic, summonPrefix), false)
})

test('canApplyPrefix: tool type gets tool and melee-swing categories', () => {
  const pickaxe = makeWeapon({ name: 'Copper Pickaxe', type: 'tool' })
  const toolPrefix = makePrefix({ appliesTo: ['tool'], weaponCategories: ['tool'] })
  assert.equal(canApplyPrefix(pickaxe, toolPrefix), true)
})

test('canApplyPrefix: boomerang accepts a universal prefix', () => {
  const boomerang = makeWeapon({ name: 'Enchanted Boomerang' })
  const universal = makePrefix({ weaponCategories: undefined })
  assert.equal(canApplyPrefix(boomerang, universal), true)
})

test('canApplyPrefix: boomerang rejects a melee-swing restricted prefix', () => {
  const boomerang = makeWeapon({ name: 'Enchanted Boomerang' })
  const meleeOnly = makePrefix({ weaponCategories: ['melee-swing'] })
  assert.equal(canApplyPrefix(boomerang, meleeOnly), false)
})

// --- applyPrefixToItemStats ---

test('applyPrefixToItemStats: damagePct +10 rounds correctly', () => {
  const item = makeWeapon({ damage: 50 })
  const prefix = makePrefix({ modifiers: { damagePct: 10 } })
  const result = applyPrefixToItemStats(item, prefix)
  assert.equal(result.damage, 55)
})

test('applyPrefixToItemStats: damagePct -15 rounds correctly', () => {
  const item = makeWeapon({ damage: 20 })
  const prefix = makePrefix({ modifiers: { damagePct: -15 } })
  const result = applyPrefixToItemStats(item, prefix)
  assert.equal(result.damage, 17)
})

test('applyPrefixToItemStats: defense flat bonus adds correctly', () => {
  const item = makeWeapon({ type: 'accessory', damage: undefined, defense: 10 })
  const prefix = makePrefix({ appliesTo: ['accessory'], modifiers: { defense: 3 } })
  const result = applyPrefixToItemStats(item as Item, prefix)
  assert.equal(result.defense, 13)
})

test('applyPrefixToItemStats: useSpeedPct +20 lowers useTime', () => {
  // Math.max(1, Math.round((25 * 100) / (100 + 20))) = Math.round(2500/120) = Math.round(20.83) = 21
  const item = makeWeapon({ useTime: 25 })
  const prefix = makePrefix({ modifiers: { useSpeedPct: 20 } })
  const result = applyPrefixToItemStats(item, prefix)
  assert.equal(result.useTime, 21)
})

test('applyPrefixToItemStats: useSpeedPct never lowers useTime below 1', () => {
  const item = makeWeapon({ useTime: 1 })
  const prefix = makePrefix({ modifiers: { useSpeedPct: 99999 } })
  const result = applyPrefixToItemStats(item, prefix)
  assert.equal(result.useTime, 1)
})

test('applyPrefixToItemStats: knockbackPct +25 produces 2-decimal precision', () => {
  // Number(((4.0 * (100 + 25)) / 100).toFixed(2)) = Number(5.00) = 5
  const item = makeWeapon({ knockback: 4.0 })
  const prefix = makePrefix({ modifiers: { knockbackPct: 25 } })
  const result = applyPrefixToItemStats(item, prefix)
  assert.equal(result.knockback, 5)
})

test('applyPrefixToItemStats: critChance adds flat to existing value', () => {
  const item = makeWeapon({ critChance: 4 })
  const prefix = makePrefix({ modifiers: { critChance: 4 } })
  const result = applyPrefixToItemStats(item, prefix)
  assert.equal(result.critChance, 8)
})

test('applyPrefixToItemStats: manaCostPct -10 reduces mana cost', () => {
  const item = makeWeapon({ name: 'Space Gun', manaCost: 10, critChance: 4 })
  const prefix = makePrefix({ weaponCategories: ['magic'], modifiers: { manaCostPct: -10 } })
  const result = applyPrefixToItemStats(item, prefix)
  assert.equal(result.manaCost, 9)
})

test('applyPrefixToItemStats: returns empty object when prefix is incompatible', () => {
  const sword = makeWeapon({ name: 'Iron Sword' })
  const rangedOnly = makePrefix({ weaponCategories: ['ranged'] })
  const result = applyPrefixToItemStats(sword, rangedOnly)
  assert.deepEqual(result, {})
})

test('applyPrefixToItemStats: omits fields undefined on the item', () => {
  // Item has no defense field
  const item = makeWeapon({ defense: undefined })
  const prefix = makePrefix({ modifiers: { damagePct: 5, defense: 3 } })
  const result = applyPrefixToItemStats(item, prefix)
  assert.equal(result.damage, 21) // 20 * 1.05 = 21
  assert.equal(result.defense, undefined)
})

test('applyPrefixToItemStats: preserves stats when prefix has no corresponding modifier', () => {
  const item = makeWeapon({ damage: 30, critChance: 6 })
  const prefix = makePrefix({ modifiers: {} })
  const result = applyPrefixToItemStats(item, prefix)
  assert.equal(result.damage, 30)
  assert.equal(result.critChance, 6)
})
