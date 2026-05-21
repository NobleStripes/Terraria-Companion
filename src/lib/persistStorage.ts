import { createJSONStorage } from 'zustand/middleware'

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