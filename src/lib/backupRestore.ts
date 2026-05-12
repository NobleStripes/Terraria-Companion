import { APP_VERSION } from '@/data'

const BACKUP_SCHEMA_VERSION = 1

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

type BackupKey = (typeof BACKUP_KEYS)[number]

type BackupData = Record<BackupKey, string | null>

export interface CompanionBackupPayload {
  schemaVersion: number
  exportedAt: string
  appVersion: string
  data: BackupData
}

function emptyBackupData(): BackupData {
  return Object.fromEntries(BACKUP_KEYS.map((key) => [key, null])) as BackupData
}

export function createCompanionBackupPayload(storage: Storage = window.localStorage): CompanionBackupPayload {
  const data = emptyBackupData()

  for (const key of BACKUP_KEYS) {
    data[key] = storage.getItem(key)
  }

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    data,
  }
}

export function serializeCompanionBackup(payload: CompanionBackupPayload): string {
  return JSON.stringify(payload, null, 2)
}

export function parseCompanionBackup(raw: string): CompanionBackupPayload {
  const parsed = JSON.parse(raw) as unknown

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup file format.')
  }

  const candidate = parsed as Partial<CompanionBackupPayload>

  if (candidate.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error('Unsupported backup schema version.')
  }

  if (typeof candidate.exportedAt !== 'string' || typeof candidate.appVersion !== 'string') {
    throw new Error('Missing backup metadata.')
  }

  if (!candidate.data || typeof candidate.data !== 'object') {
    throw new Error('Missing backup data.')
  }

  const data = emptyBackupData()

  for (const key of BACKUP_KEYS) {
    const value = (candidate.data as Record<string, unknown>)[key]
    if (value !== null && typeof value !== 'string') {
      throw new Error(`Invalid value for key: ${key}`)
    }
    data[key] = value
  }

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: candidate.exportedAt,
    appVersion: candidate.appVersion,
    data,
  }
}

export function applyCompanionBackup(payload: CompanionBackupPayload, storage: Storage = window.localStorage) {
  for (const key of BACKUP_KEYS) {
    const value = payload.data[key]
    if (value === null) {
      storage.removeItem(key)
    } else {
      storage.setItem(key, value)
    }
  }
}
