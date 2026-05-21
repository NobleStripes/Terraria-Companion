import test from 'node:test'
import assert from 'node:assert/strict'
import { useBossStore } from '../src/store/bossStore.ts'

function resetStore() {
  useBossStore.setState({
    defeatedBosses: [],
    prepChecklistByBoss: {},
    dropStatusByBoss: {},
  })
}

// --- toggleBoss / isDefeated ---

test('bossStore: toggleBoss adds a boss id to defeatedBosses', () => {
  resetStore()
  const { toggleBoss, isDefeated } = useBossStore.getState()
  toggleBoss('eye-of-cthulhu')
  assert.equal(isDefeated('eye-of-cthulhu'), true)
})

test('bossStore: toggleBoss removes a boss id on second call (toggle behavior)', () => {
  resetStore()
  const { toggleBoss, isDefeated } = useBossStore.getState()
  toggleBoss('eye-of-cthulhu')
  toggleBoss('eye-of-cthulhu')
  assert.equal(isDefeated('eye-of-cthulhu'), false)
})

test('bossStore: isDefeated returns false for an unrecognized boss id', () => {
  resetStore()
  assert.equal(useBossStore.getState().isDefeated('unknown-boss'), false)
})

// --- togglePrepItem ---

test('bossStore: togglePrepItem flips a single prep key', () => {
  resetStore()
  const { togglePrepItem, getPrepChecklist } = useBossStore.getState()
  togglePrepItem('eoc', 'arena')
  assert.equal(getPrepChecklist('eoc').arena, true)
  assert.equal(getPrepChecklist('eoc').buffs, false)
})

test('bossStore: togglePrepItem flips a key back to false on second call', () => {
  resetStore()
  const { togglePrepItem, getPrepChecklist } = useBossStore.getState()
  togglePrepItem('eoc', 'buffs')
  togglePrepItem('eoc', 'buffs')
  assert.equal(getPrepChecklist('eoc').buffs, false)
})

// --- setPrepAllForBoss / getPrepCompletion / isPrepReady ---

test('bossStore: getPrepCompletion returns 0/4 with empty checklist', () => {
  resetStore()
  const result = useBossStore.getState().getPrepCompletion('eoc')
  assert.deepEqual(result, { completed: 0, total: 4 })
})

test('bossStore: setPrepAllForBoss sets all 4 prep keys to true', () => {
  resetStore()
  const { setPrepAllForBoss, getPrepCompletion } = useBossStore.getState()
  setPrepAllForBoss('eoc')
  assert.deepEqual(getPrepCompletion('eoc'), { completed: 4, total: 4 })
})

test('bossStore: isPrepReady returns false when checklist is empty', () => {
  resetStore()
  assert.equal(useBossStore.getState().isPrepReady('eoc'), false)
})

test('bossStore: isPrepReady returns true only when all 4 keys are set', () => {
  resetStore()
  const { setPrepAllForBoss, isPrepReady } = useBossStore.getState()
  setPrepAllForBoss('eoc')
  assert.equal(isPrepReady('eoc'), true)
})

test('bossStore: isPrepReady returns false when only 3 of 4 keys are set', () => {
  resetStore()
  const { togglePrepItem, isPrepReady } = useBossStore.getState()
  togglePrepItem('eoc', 'arena')
  togglePrepItem('eoc', 'buffs')
  togglePrepItem('eoc', 'summon')
  assert.equal(isPrepReady('eoc'), false)
})

// --- resetPrepForBoss / resetPrepAll ---

test('bossStore: resetPrepForBoss clears checklist for that boss only', () => {
  resetStore()
  const { setPrepAllForBoss, resetPrepForBoss, getPrepCompletion } = useBossStore.getState()
  setPrepAllForBoss('eoc')
  setPrepAllForBoss('skeletron')
  resetPrepForBoss('eoc')
  assert.deepEqual(getPrepCompletion('eoc'), { completed: 0, total: 4 })
  assert.deepEqual(getPrepCompletion('skeletron'), { completed: 4, total: 4 })
})

// --- setDropStatus / toggleDropWish / toggleDropAcquired ---

test('bossStore: setDropStatus with "wished" records the status', () => {
  resetStore()
  const { setDropStatus, getDropStatus } = useBossStore.getState()
  setDropStatus('eoc', 'Binocular', 'wished')
  assert.equal(getDropStatus('eoc', 'Binocular'), 'wished')
})

test('bossStore: setDropStatus with "none" removes the entry', () => {
  resetStore()
  const { setDropStatus, getDropStatus } = useBossStore.getState()
  setDropStatus('eoc', 'Binocular', 'wished')
  setDropStatus('eoc', 'Binocular', 'none')
  assert.equal(getDropStatus('eoc', 'Binocular'), 'none')
})

test('bossStore: setDropStatus ignores empty-string drop names', () => {
  resetStore()
  const { setDropStatus, getDropStatus } = useBossStore.getState()
  setDropStatus('eoc', '   ', 'wished')
  assert.equal(getDropStatus('eoc', '   '), 'none')
})

test('bossStore: toggleDropWish cycles none → wished → none', () => {
  resetStore()
  const { toggleDropWish, getDropStatus } = useBossStore.getState()
  assert.equal(getDropStatus('eoc', 'Binocular'), 'none')
  toggleDropWish('eoc', 'Binocular')
  assert.equal(getDropStatus('eoc', 'Binocular'), 'wished')
  toggleDropWish('eoc', 'Binocular')
  assert.equal(getDropStatus('eoc', 'Binocular'), 'none')
})

test('bossStore: toggleDropAcquired cycles none → acquired → none', () => {
  resetStore()
  const { toggleDropAcquired, getDropStatus } = useBossStore.getState()
  toggleDropAcquired('eoc', 'Binocular')
  assert.equal(getDropStatus('eoc', 'Binocular'), 'acquired')
  toggleDropAcquired('eoc', 'Binocular')
  assert.equal(getDropStatus('eoc', 'Binocular'), 'none')
})

// --- getBossDropCounts ---

test('bossStore: getBossDropCounts returns correct counts for mixed statuses', () => {
  resetStore()
  const { setDropStatus, getBossDropCounts } = useBossStore.getState()
  setDropStatus('eoc', 'Binocular', 'wished')
  setDropStatus('eoc', 'Hook', 'acquired')
  setDropStatus('eoc', 'Shield', 'none') // effectively absent

  const counts = getBossDropCounts('eoc', ['Binocular', 'Hook', 'Shield', 'Lens'])
  assert.equal(counts.total, 4)
  assert.equal(counts.wished, 1)
  assert.equal(counts.acquired, 1)
})

test('bossStore: getBossDropCounts deduplicates repeated drop names', () => {
  resetStore()
  const { getBossDropCounts } = useBossStore.getState()
  const counts = getBossDropCounts('eoc', ['Binocular', 'Binocular'])
  assert.equal(counts.total, 1)
})

// --- getTrackedDropNames ---

test('bossStore: getTrackedDropNames returns all tracked names across bosses', () => {
  resetStore()
  const { setDropStatus, getTrackedDropNames } = useBossStore.getState()
  setDropStatus('eoc', 'Binocular', 'wished')
  setDropStatus('skeletron', 'Skull', 'acquired')

  const names = getTrackedDropNames()
  assert.ok(names.includes('Binocular'))
  assert.ok(names.includes('Skull'))
})

test('bossStore: getTrackedDropNames filtered to "wished" excludes acquired drops', () => {
  resetStore()
  const { setDropStatus, getTrackedDropNames } = useBossStore.getState()
  setDropStatus('eoc', 'Binocular', 'wished')
  setDropStatus('eoc', 'Hook', 'acquired')

  const wished = getTrackedDropNames('wished')
  assert.ok(wished.includes('Binocular'))
  assert.equal(wished.includes('Hook'), false)
})

test('bossStore: getTrackedDropNames filtered to "acquired" excludes wished drops', () => {
  resetStore()
  const { setDropStatus, getTrackedDropNames } = useBossStore.getState()
  setDropStatus('eoc', 'Binocular', 'wished')
  setDropStatus('eoc', 'Hook', 'acquired')

  const acquired = getTrackedDropNames('acquired')
  assert.ok(acquired.includes('Hook'))
  assert.equal(acquired.includes('Binocular'), false)
})

// --- resetAll ---

test('bossStore: resetAll clears defeatedBosses, prepChecklist, and dropStatus', () => {
  resetStore()
  const { toggleBoss, setPrepAllForBoss, setDropStatus, resetAll } = useBossStore.getState()
  toggleBoss('eoc')
  setPrepAllForBoss('eoc')
  setDropStatus('eoc', 'Binocular', 'wished')

  resetAll()

  const state = useBossStore.getState()
  assert.deepEqual(state.defeatedBosses, [])
  assert.deepEqual(state.prepChecklistByBoss, {})
  assert.deepEqual(state.dropStatusByBoss, {})
})
