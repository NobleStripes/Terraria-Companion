import { useMemo, useState } from 'react'

export interface SearchPreset<TFilters> {
  id: string
  name: string
  query: string
  filters: TFilters
  updatedAt: number
}

function makePresetId() {
  return Math.random().toString(36).slice(2, 10)
}

function loadPresets<TFilters>(storageKey: string): SearchPreset<TFilters>[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null
        }

        const value = entry as Partial<SearchPreset<TFilters>>
        if (typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.query !== 'string') {
          return null
        }

        return {
          id: value.id,
          name: value.name,
          query: value.query,
          filters: (value.filters ?? {}) as TFilters,
          updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
        }
      })
      .filter((entry): entry is SearchPreset<TFilters> => entry !== null)
      .sort((left, right) => right.updatedAt - left.updatedAt)
  } catch {
    return []
  }
}

function persistPresets<TFilters>(storageKey: string, presets: SearchPreset<TFilters>[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(presets))
}

export function useSearchPresets<TFilters>(storageKey: string) {
  const [presets, setPresets] = useState<SearchPreset<TFilters>[]>(() => loadPresets<TFilters>(storageKey))

  const actions = useMemo(() => {
    return {
      savePreset: (name: string, query: string, filters: TFilters) => {
        const normalizedName = name.trim()
        if (!normalizedName) {
          return
        }

        setPresets((current) => {
          const nextPreset: SearchPreset<TFilters> = {
            id: makePresetId(),
            name: normalizedName,
            query,
            filters,
            updatedAt: Date.now(),
          }
          const next = [nextPreset, ...current]
          persistPresets(storageKey, next)
          return next
        })
      },
      renamePreset: (id: string, name: string) => {
        const normalizedName = name.trim()
        if (!normalizedName) {
          return
        }

        setPresets((current) => {
          const next = current.map((preset) =>
            preset.id === id
              ? { ...preset, name: normalizedName, updatedAt: Date.now() }
              : preset
          )
          persistPresets(storageKey, next)
          return next
        })
      },
      deletePreset: (id: string) => {
        setPresets((current) => {
          const next = current.filter((preset) => preset.id !== id)
          persistPresets(storageKey, next)
          return next
        })
      },
    }
  }, [storageKey])

  return {
    presets,
    ...actions,
  }
}
