import { createJSONStorage } from 'zustand/middleware'

/**
 * SECURITY NOTICE: localStorage Data Encryption
 * 
 * This module uses browser localStorage to persist user data locally.
 * localStorage is NOT encrypted by default - all data is stored as plaintext.
 * 
 * Risk Assessment:
 * - SHARED COMPUTERS: Any user with access to the machine can view stored data
 * - BROWSER COMPROMISE: Compromised browser extensions or XSS attacks could access data
 * - BACKUPS: Exported backup files are not encrypted unless password-protected
 * 
 * User Recommendations:
 * 1. Do NOT store sensitive data in profiles (e.g., real passwords, personal info)
 * 2. Store backup files securely, preferably in password-protected locations
 * 3. Be cautious when sharing devices - clear localStorage before handing off computer
 * 4. Avoid using public/shared computers for sensitive build planning
 * 5. Consider browser security: use updated browsers, disable untrusted extensions
 */

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