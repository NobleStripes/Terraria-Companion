import test from 'node:test'
import assert from 'node:assert/strict'
import { buildProfileStorageKey, getProfileStorageKeyCandidates } from '../src/lib/persistStorage.ts'
import { normalizeBossStorePersistedState } from '../src/store/bossStore.ts'
import { normalizeBuildStorePersistedState } from '../src/store/buildStore.ts'

test('persistStorage: buildProfileStorageKey keeps base key without profile id', () => {
  assert.equal(buildProfileStorageKey('terraria-build-planner'), 'terraria-build-planner')
  assert.equal(buildProfileStorageKey('terraria-build-planner', '   '), 'terraria-build-planner')
})

test('persistStorage: buildProfileStorageKey appends normalized profile id', () => {
  assert.equal(
    buildProfileStorageKey('terraria-build-planner', '  My Profile  '),
    'terraria-build-planner::profile::my profile',
  )
})

test('persistStorage: getProfileStorageKeyCandidates prefers profile key then legacy key', () => {
  assert.deepEqual(getProfileStorageKeyCandidates('terraria-boss-tracker', 'world-a'), [
    'terraria-boss-tracker::profile::world-a',
    'terraria-boss-tracker',
  ])
})

test('bossStore migration: normalizes malformed persisted state safely', () => {
  const migrated = normalizeBossStorePersistedState({
    defeatedBosses: ['eye-of-cthulhu', 123, null],
    prepChecklistByBoss: {
      eoc: { arena: true, buffs: 1, summon: null, mobility: 'yes' },
    },
    dropStatusByBoss: {
      eoc: {
        Binoculars: 'wished',
        '  ': 'acquired',
        Hook: 'invalid',
      },
      bad: 42,
    },
  })

  assert.deepEqual(migrated.defeatedBosses, ['eye-of-cthulhu'])
  assert.deepEqual(migrated.prepChecklistByBoss.eoc, {
    arena: true,
    buffs: true,
    summon: false,
    mobility: true,
  })
  assert.deepEqual(migrated.dropStatusByBoss, {
    eoc: {
      Binoculars: 'wished',
    },
  })
})

test('buildStore migration: drops invalid loadouts and resolves active id fallback', () => {
  const migrated = normalizeBuildStorePersistedState({
    loadouts: [
      {
        id: 'valid-1',
        name: 'Valid Build',
        class: 'magic',
        slots: {
          armor: [1, 2, 3],
          accessories: [4, 5],
          weapon: 6,
        },
      },
      {
        id: 9,
        name: 'Invalid Build',
        class: 'magic',
        slots: {},
      },
    ],
    activeLoadoutId: 'missing-id',
  })

  assert.equal(migrated.loadouts.length, 1)
  assert.equal(migrated.loadouts[0].id, 'valid-1')
  assert.equal(migrated.activeLoadoutId, 'valid-1')
})
