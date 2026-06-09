import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createCompanionBackupPayload,
  serializeCompanionBackup,
  parseCompanionBackup,
  applyCompanionBackup,
} from '../src/lib/backupRestore.ts'
import type { CompanionBackupPayload } from '../src/lib/backupRestore.ts'

const BACKUP_KEYS = [
  'terraria-build-planner',
  'terraria-boss-tracker',
  'terraria-item-presets',
  'terraria-biome-presets',
  'terraria-npc-presets',
  'terraria-build-stages-preferences',
  'terraria-build-stages-presets',
  'terraria-build-stages-pinned',
  'terra-high-contrast',
  'terra-reduced-motion',
] as const

function makeStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    get length() { return store.size },
    clear() { store.clear() },
    getItem(key) { return store.get(key) ?? null },
    key(index) { return Array.from(store.keys())[index] ?? null },
    removeItem(key) { store.delete(key) },
    setItem(key, value) { store.set(key, value) },
  }
}

function makeValidPayload(overrides: Partial<CompanionBackupPayload> = {}): CompanionBackupPayload {
  const data = Object.fromEntries(BACKUP_KEYS.map((k) => [k, null])) as CompanionBackupPayload['data']
  return {
    schemaVersion: 2,
    exportedAt: '2024-01-01T00:00:00.000Z',
    appVersion: '1.3.0',
    data,
    profileScopedData: {},
    ...overrides,
  }
}

// --- createCompanionBackupPayload ---

test('createCompanionBackupPayload: captures all tracked keys from storage', () => {
  const storage = makeStorage({ 'terraria-boss-tracker': '{"defeatedBosses":[]}', 'terra-high-contrast': '1' })
  const payload = createCompanionBackupPayload(storage)

  assert.equal(payload.schemaVersion, 2)
  assert.ok(typeof payload.exportedAt === 'string')
  assert.ok(typeof payload.appVersion === 'string')
  assert.equal(payload.data['terraria-boss-tracker'], '{"defeatedBosses":[]}')
  assert.equal(payload.data['terra-high-contrast'], '1')
})

test('createCompanionBackupPayload: includes profile-scoped storage entries', () => {
  const storage = makeStorage({
    'terraria-boss-tracker::profile::world-a': '{"defeatedBosses":["eye-of-cthulhu"]}',
    'terraria-build-planner::profile::world-a': '{"loadouts":[]}',
    'unrelated::profile::x': 'ignored',
  })
  const payload = createCompanionBackupPayload(storage)

  assert.deepEqual(payload.profileScopedData, {
    'terraria-boss-tracker::profile::world-a': '{"defeatedBosses":["eye-of-cthulhu"]}',
    'terraria-build-planner::profile::world-a': '{"loadouts":[]}',
  })
})

test('createCompanionBackupPayload: missing keys are null in the payload', () => {
  const storage = makeStorage()
  const payload = createCompanionBackupPayload(storage)

  for (const key of BACKUP_KEYS) {
    assert.equal(payload.data[key], null, `key ${key} should be null when not in storage`)
  }
})

test('createCompanionBackupPayload: all 10 backup keys are present in payload data', () => {
  const storage = makeStorage()
  const payload = createCompanionBackupPayload(storage)
  const keys = Object.keys(payload.data)
  assert.equal(keys.length, BACKUP_KEYS.length)
  for (const key of BACKUP_KEYS) {
    assert.ok(keys.includes(key), `missing key: ${key}`)
  }
})

// --- serializeCompanionBackup ---

test('serializeCompanionBackup: produces valid JSON', () => {
  const payload = makeValidPayload()
  const json = serializeCompanionBackup(payload)
  assert.doesNotThrow(() => JSON.parse(json))
})

test('serializeCompanionBackup: round-trips through JSON.parse with same shape', () => {
  const payload = makeValidPayload({ data: { ...Object.fromEntries(BACKUP_KEYS.map((k) => [k, null])), 'terra-high-contrast': '1' } as CompanionBackupPayload['data'] })
  const json = serializeCompanionBackup(payload)
  const parsed = JSON.parse(json)
  assert.equal(parsed.schemaVersion, payload.schemaVersion)
  assert.equal(parsed.appVersion, payload.appVersion)
  assert.equal(parsed.data['terra-high-contrast'], '1')
})

// --- parseCompanionBackup ---

test('parseCompanionBackup: returns valid payload for well-formed input', () => {
  const payload = makeValidPayload({
    data: { ...Object.fromEntries(BACKUP_KEYS.map((k) => [k, null])), 'terraria-boss-tracker': 'some-data' } as CompanionBackupPayload['data'],
    profileScopedData: {
      'terraria-boss-tracker::profile::alpha': '{"defeatedBosses":["skeletron"]}',
    },
  })
  const json = serializeCompanionBackup(payload)
  const result = parseCompanionBackup(json)

  assert.equal(result.schemaVersion, 2)
  assert.equal(result.data['terraria-boss-tracker'], 'some-data')
  assert.equal(result.data['terra-high-contrast'], null)
  assert.equal(result.profileScopedData['terraria-boss-tracker::profile::alpha'], '{"defeatedBosses":["skeletron"]}')
})

test('parseCompanionBackup: accepts schemaVersion 1 and normalizes to schemaVersion 2', () => {
  const v1Payload = {
    schemaVersion: 1,
    exportedAt: '2024-01-01T00:00:00.000Z',
    appVersion: '1.0.0',
    data: Object.fromEntries(BACKUP_KEYS.map((k) => [k, null])),
  }

  const result = parseCompanionBackup(JSON.stringify(v1Payload))
  assert.equal(result.schemaVersion, 2)
  assert.deepEqual(result.profileScopedData, {})
})

test('parseCompanionBackup: throws on malformed JSON', () => {
  assert.throws(() => parseCompanionBackup('not valid json'))
})

test('parseCompanionBackup: throws when schemaVersion does not match', () => {
  const json = JSON.stringify({ schemaVersion: 99, exportedAt: '2024-01-01T00:00:00.000Z', appVersion: '1.0.0', data: {} })
  assert.throws(() => parseCompanionBackup(json), /Unsupported backup schema version/i)
})

test('parseCompanionBackup: throws when exportedAt is missing', () => {
  const json = JSON.stringify({ schemaVersion: 1, appVersion: '1.0.0', data: {} })
  assert.throws(() => parseCompanionBackup(json), /Missing backup metadata/i)
})

test('parseCompanionBackup: throws when appVersion is missing', () => {
  const json = JSON.stringify({ schemaVersion: 1, exportedAt: '2024-01-01T00:00:00.000Z', data: {} })
  assert.throws(() => parseCompanionBackup(json), /Missing backup metadata/i)
})

test('parseCompanionBackup: throws when data field is absent', () => {
  const json = JSON.stringify({ schemaVersion: 1, exportedAt: '2024-01-01T00:00:00.000Z', appVersion: '1.0.0' })
  assert.throws(() => parseCompanionBackup(json), /Missing backup data/i)
})

test('parseCompanionBackup: throws when a tracked key has an invalid (non-string, non-null) value', () => {
  const data = Object.fromEntries(BACKUP_KEYS.map((k) => [k, null]))
  data['terraria-boss-tracker'] = 42 as unknown as string
  const json = JSON.stringify({ schemaVersion: 1, exportedAt: '2024-01-01T00:00:00.000Z', appVersion: '1.0.0', data })
  assert.throws(() => parseCompanionBackup(json), /Invalid value for key/i)
})

test('parseCompanionBackup: throws when profile-scoped data is missing for schema v2', () => {
  const json = JSON.stringify({
    schemaVersion: 2,
    exportedAt: '2024-01-01T00:00:00.000Z',
    appVersion: '1.0.0',
    data: Object.fromEntries(BACKUP_KEYS.map((k) => [k, null])),
  })

  assert.throws(() => parseCompanionBackup(json), /Missing profile-scoped backup data/i)
})

test('parseCompanionBackup: throws when profile-scoped key is invalid', () => {
  const json = JSON.stringify({
    schemaVersion: 2,
    exportedAt: '2024-01-01T00:00:00.000Z',
    appVersion: '1.0.0',
    data: Object.fromEntries(BACKUP_KEYS.map((k) => [k, null])),
    profileScopedData: {
      'invalid-prefix::profile::alpha': '{}',
    },
  })

  assert.throws(() => parseCompanionBackup(json), /Invalid profile-scoped key/i)
})

// --- applyCompanionBackup ---

test('applyCompanionBackup: writes non-null values to storage', () => {
  const storage = makeStorage()
  const payload = makeValidPayload({
    data: { ...Object.fromEntries(BACKUP_KEYS.map((k) => [k, null])), 'terraria-boss-tracker': '{"defeatedBosses":["eoc"]}' } as CompanionBackupPayload['data'],
  })
  applyCompanionBackup(payload, storage)

  assert.equal(storage.getItem('terraria-boss-tracker'), '{"defeatedBosses":["eoc"]}')
})

test('applyCompanionBackup: removes keys from storage when value is null', () => {
  const storage = makeStorage({ 'terra-high-contrast': '1' })
  const payload = makeValidPayload()
  applyCompanionBackup(payload, storage)

  assert.equal(storage.getItem('terra-high-contrast'), null)
})

test('applyCompanionBackup: full round-trip restores original storage state', () => {
  const original = makeStorage({
    'terraria-boss-tracker': '{"defeatedBosses":["skeletron"]}',
    'terra-high-contrast': '1',
    'terraria-boss-tracker::profile::alpha': '{"defeatedBosses":["eye-of-cthulhu"]}',
  })
  const payload = createCompanionBackupPayload(original)
  const json = serializeCompanionBackup(payload)
  const parsed = parseCompanionBackup(json)

  const restored = makeStorage()
  applyCompanionBackup(parsed, restored)

  assert.equal(restored.getItem('terraria-boss-tracker'), '{"defeatedBosses":["skeletron"]}')
  assert.equal(restored.getItem('terra-high-contrast'), '1')
  assert.equal(restored.getItem('terraria-build-planner'), null)
  assert.equal(restored.getItem('terraria-boss-tracker::profile::alpha'), '{"defeatedBosses":["eye-of-cthulhu"]}')
})

test('applyCompanionBackup: clears stale profile-scoped keys before restoring', () => {
  const storage = makeStorage({
    'terraria-boss-tracker::profile::old': '{"defeatedBosses":["old"]}',
  })
  const payload = makeValidPayload({
    profileScopedData: {
      'terraria-boss-tracker::profile::new': '{"defeatedBosses":["new"]}',
    },
  })

  applyCompanionBackup(payload, storage)

  assert.equal(storage.getItem('terraria-boss-tracker::profile::old'), null)
  assert.equal(storage.getItem('terraria-boss-tracker::profile::new'), '{"defeatedBosses":["new"]}')
})
