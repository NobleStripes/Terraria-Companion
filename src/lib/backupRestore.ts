import { APP_VERSION } from '@/data'
import { PROFILE_KEY_SEPARATOR } from '@/lib/persistStorage'

const BACKUP_SCHEMA_VERSION = 2

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

const PROFILE_SCOPED_BASE_KEYS = [
  'terraria-build-planner',
  'terraria-boss-tracker',
  'terraria-item-presets',
  'terraria-biome-presets',
  'terraria-npc-presets',
  'terraria-build-stages-preferences',
  'terraria-build-stages-presets',
  'terraria-build-stages-pinned',
] as const

type BackupKey = (typeof BACKUP_KEYS)[number]

type BackupData = Record<BackupKey, string | null>

export interface CompanionBackupPayload {
  schemaVersion: number
  exportedAt: string
  appVersion: string
  data: BackupData
  profileScopedData: Record<string, string>
}

function emptyBackupData(): BackupData {
  return Object.fromEntries(BACKUP_KEYS.map((key) => [key, null])) as BackupData
}

function isProfileScopedBackupKey(candidate: string): boolean {
  return PROFILE_SCOPED_BASE_KEYS.some((baseKey) => candidate.startsWith(`${baseKey}${PROFILE_KEY_SEPARATOR}`))
}

function collectProfileScopedData(storage: Storage): Record<string, string> {
  const profileScopedData: Record<string, string> = {}

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (!key || !isProfileScopedBackupKey(key)) {
      continue
    }

    const value = storage.getItem(key)
    if (typeof value === 'string') {
      profileScopedData[key] = value
    }
  }

  return profileScopedData
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
    profileScopedData: collectProfileScopedData(storage),
  }
}

export function serializeCompanionBackup(payload: CompanionBackupPayload): string {
  return JSON.stringify(payload, null, 2)
}

export function parseCompanionBackup(raw: string): CompanionBackupPayload {
  // Security: Validate file size to prevent DoS
  const MAX_BACKUP_SIZE = 10 * 1024 * 1024 // 10MB
  if (raw.length > MAX_BACKUP_SIZE) {
    throw new Error('Backup file exceeds maximum size limit (10MB)')
  }

  const parsed = JSON.parse(raw) as unknown

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup file format.')
  }

  const candidate = parsed as Partial<CompanionBackupPayload>

  if (candidate.schemaVersion !== 1 && candidate.schemaVersion !== BACKUP_SCHEMA_VERSION) {
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

  const profileScopedData: Record<string, string> = {}

  if (candidate.schemaVersion === BACKUP_SCHEMA_VERSION) {
    if (candidate.profileScopedData === undefined) {
      throw new Error('Missing profile-scoped backup data.')
    }

    if (!candidate.profileScopedData || typeof candidate.profileScopedData !== 'object') {
      throw new Error('Invalid profile-scoped backup data.')
    }

    for (const [key, value] of Object.entries(candidate.profileScopedData)) {
      if (!isProfileScopedBackupKey(key)) {
        throw new Error(`Invalid profile-scoped key: ${key}`)
      }

      if (typeof value !== 'string') {
        throw new Error(`Invalid profile-scoped value for key: ${key}`)
      }

      // Security: Enforce max string field length (100KB per field)
      if (value.length > 100_000) {
        throw new Error(`Profile-scoped data value for key '${key}' exceeds maximum length`)
      }

      profileScopedData[key] = value
    }
  }

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: candidate.exportedAt,
    appVersion: candidate.appVersion,
    data,
    profileScopedData,
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

  const existingProfileScopedKeys: string[] = []

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key && isProfileScopedBackupKey(key)) {
      existingProfileScopedKeys.push(key)
    }
  }

  for (const key of existingProfileScopedKeys) {
    storage.removeItem(key)
  }

  for (const [key, value] of Object.entries(payload.profileScopedData ?? {})) {
    storage.setItem(key, value)
  }
}
