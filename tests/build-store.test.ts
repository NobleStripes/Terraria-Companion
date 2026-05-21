import test from 'node:test'
import assert from 'node:assert/strict'
import { useBuildStore } from '../src/store/buildStore.ts'

function resetStore() {
  useBuildStore.setState({ loadouts: [], activeLoadoutId: null })
}

function createTestLoadout(name = 'Test Loadout') {
  return useBuildStore.getState().createLoadout({ name, class: 'melee' })
}

// --- createLoadout ---

test('buildStore: createLoadout adds a loadout and makes it active', () => {
  resetStore()
  const id = createTestLoadout('My Build')
  const state = useBuildStore.getState()
  assert.equal(state.loadouts.length, 1)
  assert.equal(state.loadouts[0].name, 'My Build')
  assert.equal(state.activeLoadoutId, id)
})

test('buildStore: createLoadout sets correct class', () => {
  resetStore()
  useBuildStore.getState().createLoadout({ name: 'Ranger', class: 'ranged' })
  const state = useBuildStore.getState()
  assert.equal(state.loadouts[0].class, 'ranged')
})

test('buildStore: createLoadout initializes slots with empty armor and accessories', () => {
  resetStore()
  createTestLoadout()
  const { slots } = useBuildStore.getState().loadouts[0]
  assert.equal(slots.armor.length, 3)
  assert.equal(slots.accessories.length, 5)
  assert.equal(slots.weapon, undefined)
})

// --- removeLoadout ---

test('buildStore: removeLoadout removes the loadout from the list', () => {
  resetStore()
  const id = createTestLoadout()
  useBuildStore.getState().removeLoadout(id)
  assert.equal(useBuildStore.getState().loadouts.length, 0)
})

test('buildStore: removeLoadout sets activeLoadoutId to null when last loadout is removed', () => {
  resetStore()
  const id = createTestLoadout()
  useBuildStore.getState().removeLoadout(id)
  assert.equal(useBuildStore.getState().activeLoadoutId, null)
})

test('buildStore: removeLoadout reassigns active to first remaining loadout', () => {
  resetStore()
  const id1 = createTestLoadout('Build A')
  const id2 = createTestLoadout('Build B')
  useBuildStore.getState().setActive(id1)
  useBuildStore.getState().removeLoadout(id1)
  // After removing the active, the first remaining (id2) becomes active
  assert.equal(useBuildStore.getState().activeLoadoutId, id2)
})

// --- duplicateLoadout ---

test('buildStore: duplicateLoadout creates a copy with "(copy)" suffix', () => {
  resetStore()
  const id = createTestLoadout('Original')
  useBuildStore.getState().duplicateLoadout(id)
  const state = useBuildStore.getState()
  assert.equal(state.loadouts.length, 2)
  const copy = state.loadouts.find((l) => l.name.includes('copy'))
  assert.ok(copy, 'copy should exist')
  assert.equal(copy.name, 'Original (copy)')
})

test('buildStore: duplicateLoadout makes the copy the active loadout', () => {
  resetStore()
  const id = createTestLoadout('Original')
  useBuildStore.getState().duplicateLoadout(id)
  const state = useBuildStore.getState()
  const copy = state.loadouts.find((l) => l.name.includes('copy'))
  assert.ok(copy)
  assert.equal(state.activeLoadoutId, copy.id)
})

test('buildStore: duplicateLoadout preserves original loadout', () => {
  resetStore()
  const id = createTestLoadout('Original')
  useBuildStore.getState().duplicateLoadout(id)
  const state = useBuildStore.getState()
  const original = state.loadouts.find((l) => l.id === id)
  assert.ok(original, 'original should still exist')
})

// --- renameLoadout ---

test('buildStore: renameLoadout updates only the name', () => {
  resetStore()
  const id = createTestLoadout('Old Name')
  useBuildStore.getState().renameLoadout(id, 'New Name')
  const loadout = useBuildStore.getState().loadouts[0]
  assert.equal(loadout.name, 'New Name')
  assert.equal(loadout.class, 'melee')
})

// --- updateLoadoutClass ---

test('buildStore: updateLoadoutClass changes only the class', () => {
  resetStore()
  const id = createTestLoadout('My Build')
  useBuildStore.getState().updateLoadoutClass(id, 'summoner')
  const loadout = useBuildStore.getState().loadouts[0]
  assert.equal(loadout.class, 'summoner')
  assert.equal(loadout.name, 'My Build')
})

// --- setWeapon ---

test('buildStore: setWeapon updates the weapon slot', () => {
  resetStore()
  const id = createTestLoadout()
  useBuildStore.getState().setWeapon(id, 123)
  const loadout = useBuildStore.getState().loadouts[0]
  assert.equal(loadout.slots.weapon, 123)
})

test('buildStore: setWeapon clears the weapon slot when called with undefined', () => {
  resetStore()
  const id = createTestLoadout()
  useBuildStore.getState().setWeapon(id, 123)
  useBuildStore.getState().setWeapon(id, undefined)
  const loadout = useBuildStore.getState().loadouts[0]
  assert.equal(loadout.slots.weapon, undefined)
})

// --- setArmorSlot ---

test('buildStore: setArmorSlot updates the correct armor slot', () => {
  resetStore()
  const id = createTestLoadout()
  useBuildStore.getState().setArmorSlot(id, 1, 456)
  const { armor } = useBuildStore.getState().loadouts[0].slots
  assert.equal(armor[0], undefined)
  assert.equal(armor[1], 456)
  assert.equal(armor[2], undefined)
})

// --- setAccessorySlot ---

test('buildStore: setAccessorySlot updates the correct accessory slot', () => {
  resetStore()
  const id = createTestLoadout()
  useBuildStore.getState().setAccessorySlot(id, 2, 789)
  const { accessories } = useBuildStore.getState().loadouts[0].slots
  assert.equal(accessories[2], 789)
  assert.equal(accessories[0], undefined)
})

test('buildStore: setAccessorySlot ignores out-of-bounds slot index', () => {
  resetStore()
  const id = createTestLoadout()
  useBuildStore.getState().setAccessorySlot(id, 99, 789)
  const { accessories } = useBuildStore.getState().loadouts[0].slots
  assert.equal(accessories.every((a) => a === undefined), true)
})

// --- setActive ---

test('buildStore: setActive changes the active loadout id', () => {
  resetStore()
  const id1 = createTestLoadout('A')
  const id2 = createTestLoadout('B')
  useBuildStore.getState().setActive(id1)
  assert.equal(useBuildStore.getState().activeLoadoutId, id1)
  useBuildStore.getState().setActive(id2)
  assert.equal(useBuildStore.getState().activeLoadoutId, id2)
})

// --- mergeLoadouts ---

test('buildStore: mergeLoadouts appends loadouts not already in the list', () => {
  resetStore()
  const id = createTestLoadout('Existing')
  useBuildStore.getState().mergeLoadouts([
    { id: 'new-1', name: 'Incoming', class: 'magic', slots: { armor: [], accessories: [] } },
  ])
  assert.equal(useBuildStore.getState().loadouts.length, 2)
  assert.ok(useBuildStore.getState().loadouts.find((l) => l.id === 'new-1'))
  assert.ok(useBuildStore.getState().loadouts.find((l) => l.id === id))
})

test('buildStore: mergeLoadouts updates an existing loadout when ids match', () => {
  resetStore()
  const id = createTestLoadout('Original')
  useBuildStore.getState().mergeLoadouts([
    { id, name: 'Updated', class: 'ranged', slots: { armor: [], accessories: [] } },
  ])
  const updated = useBuildStore.getState().loadouts.find((l) => l.id === id)
  assert.ok(updated)
  assert.equal(updated.name, 'Updated')
  assert.equal(updated.class, 'ranged')
})

test('buildStore: mergeLoadouts uses preferredActiveLoadoutId when it exists in merged list', () => {
  resetStore()
  createTestLoadout('A')
  useBuildStore.getState().mergeLoadouts(
    [{ id: 'pref', name: 'Preferred', class: 'magic', slots: { armor: [], accessories: [] } }],
    'pref',
  )
  assert.equal(useBuildStore.getState().activeLoadoutId, 'pref')
})
