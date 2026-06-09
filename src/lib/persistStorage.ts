import { createJSONStorage } from 'zustand/middleware'

export const PROFILE_KEY_SEPARATOR = '::profile::'

const memoryStorage = new Map<string, string>()

const fallbackStorage = {
  getItem: (name: string) => (memoryStorage.has(name) ? memoryStorage.get(name)! : null),
  setItem: (name: string, value: string) => {
    memoryStorage.set(name, value)
  },
  removeItem: (name: string) => {
    memoryStorage.delete(name)
  },
}

function normalizeProfileId(profileId: string): string {
  return profileId.trim().toLowerCase()
}

export function buildProfileStorageKey(baseKey: string, profileId?: string | null): string {
  if (!profileId) {
    return baseKey
  }

  const normalizedProfileId = normalizeProfileId(profileId)
  if (!normalizedProfileId) {
    return baseKey
  }

  return `${baseKey}${PROFILE_KEY_SEPARATOR}${normalizedProfileId}`
}

export function getProfileStorageKeyCandidates(baseKey: string, profileId?: string | null): string[] {
  const candidates = [baseKey]
  const profileKey = buildProfileStorageKey(baseKey, profileId)

  if (profileKey !== baseKey) {
    candidates.unshift(profileKey)
  }

  return candidates
}

export function createSafeJsonStorage<S>() {
  return createJSONStorage<S>(() => {
    try {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
        return globalThis.localStorage
      }
    } catch {
      // Ignore access errors and fall back to in-memory storage for non-browser runtimes.
    }

    return fallbackStorage
  })
}