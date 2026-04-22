import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const items = JSON.parse(fs.readFileSync(new URL('../src/data/items.json', import.meta.url), 'utf8'))
const prefixes = JSON.parse(fs.readFileSync(new URL('../src/data/prefixes.json', import.meta.url), 'utf8'))
const prefixById = new Map(prefixes.map((prefix) => [prefix.id, prefix]))
const itemByName = new Map(items.map((item) => [item.name, item]))

function getWeaponCategories(item) {
  if (item.type === 'tool') {
    return ['tool', 'melee-swing']
  }

  if (item.type !== 'weapon') {
    return []
  }

  const lowerName = item.name.toLowerCase()

  if (/(yoyo|boomerang|flail|spear|javelin|bananarang|disc)/.test(lowerName)) {
    return []
  }

  if (lowerName === 'terrarian') {
    return []
  }

  if (/whip/.test(lowerName)) {
    return ['melee-swing']
  }

  if ((item.critChance ?? 0) === 0 && (item.manaCost ?? 0) > 0) {
    return ['summon']
  }

  if ((item.manaCost ?? 0) > 0) {
    return ['magic']
  }

  if (/(bow|gun|rifle|launcher|repeater|shotbow|musket|pistol|sniper|uzi|blaster|cannon|dart|stormbow)/.test(lowerName)) {
    return ['ranged']
  }

  return ['melee-swing']
}

function canApplyPrefix(item, prefix) {
  if (!prefix.appliesTo.includes(item.type)) {
    return false
  }

  if (!Array.isArray(prefix.weaponCategories) || prefix.weaponCategories.length === 0) {
    return true
  }

  const categories = getWeaponCategories(item)
  return prefix.weaponCategories.some((category) => categories.includes(category))
}

test('alternatePrefixes only reference valid compatible prefixes', () => {
  for (const item of items) {
    if (!Array.isArray(item.alternatePrefixes)) continue

    for (const prefixId of item.alternatePrefixes) {
      const prefix = prefixById.get(prefixId)
      assert.ok(prefix, `${item.name} has unknown prefix ${prefixId}`)
      assert.ok(canApplyPrefix(item, prefix), `${item.name} cannot use prefix ${prefixId}`)
    }
  }
})

test('exclusive prefixes only appear on compatible weapon families', () => {
  const unreal = prefixById.get('unreal')
  const mythical = prefixById.get('mythical')
  const legendary = prefixById.get('legendary')
  const fabled = prefixById.get('fabled')

  assert.ok(unreal)
  assert.ok(mythical)
  assert.ok(legendary)
  assert.ok(fabled)

  const daedalusStormbow = itemByName.get('Daedalus Stormbow')
  const spaceGun = itemByName.get('Space Gun')
  const slimeStaff = itemByName.get('Slime Staff')
  const nightsEdge = itemByName.get("Night's Edge")
  const cobwhip = itemByName.get('Cobwhip')

  assert.ok(daedalusStormbow)
  assert.ok(spaceGun)
  assert.ok(slimeStaff)
  assert.ok(nightsEdge)
  assert.ok(cobwhip)

  assert.equal(canApplyPrefix(daedalusStormbow, unreal), true, 'Daedalus Stormbow should allow Unreal')
  assert.equal(canApplyPrefix(spaceGun, unreal), false, 'Space Gun should not allow Unreal')
  assert.equal(canApplyPrefix(slimeStaff, unreal), false, 'Slime Staff should not allow Unreal')

  assert.equal(canApplyPrefix(spaceGun, mythical), true, 'Space Gun should allow Mythical')
  assert.equal(canApplyPrefix(daedalusStormbow, mythical), false, 'Daedalus Stormbow should not allow Mythical')
  assert.equal(canApplyPrefix(slimeStaff, mythical), false, 'Slime Staff should not allow Mythical')

  assert.equal(canApplyPrefix(nightsEdge, legendary), true, "Night's Edge should allow Legendary")
  assert.equal(canApplyPrefix(cobwhip, legendary), true, 'Cobwhip should allow Legendary')
  assert.equal(canApplyPrefix(spaceGun, legendary), false, 'Space Gun should not allow Legendary')
  assert.equal(canApplyPrefix(slimeStaff, legendary), false, 'Slime Staff should not allow Legendary')

  assert.equal(canApplyPrefix(slimeStaff, fabled), true, 'Slime Staff should allow Fabled')
  assert.equal(canApplyPrefix(cobwhip, fabled), false, 'Cobwhip should not allow Fabled')
  assert.equal(canApplyPrefix(spaceGun, fabled), false, 'Space Gun should not allow Fabled')
  assert.equal(canApplyPrefix(daedalusStormbow, fabled), false, 'Daedalus Stormbow should not allow Fabled')
})
