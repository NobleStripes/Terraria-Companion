import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BuildClass } from '@/types/boss'
import { itemsById, items } from '@/data/index'

export interface LoadoutSlots {
  armor: [number?, number?, number?]
  accessories: (number | undefined)[]
  weapon?: number
}

export interface Loadout {
  id: string
  name: string
  class: BuildClass
  slots: LoadoutSlots
}

interface BuildState {
  loadouts: Loadout[]
  activeLoadoutId: string | null
  createLoadout: (config: { name: string; class: BuildClass; slots?: Partial<LoadoutSlots> }) => string
  addLoadout: (loadout: Omit<Loadout, 'id'>) => string
  mergeLoadouts: (loadouts: Loadout[], preferredActiveLoadoutId?: string | null) => void
  updateLoadout: (id: string, patch: Partial<Loadout>) => void
  renameLoadout: (id: string, name: string) => void
  updateLoadoutClass: (id: string, buildClass: BuildClass) => void
  setWeapon: (id: string, itemId?: number) => void
  setArmorSlot: (id: string, slotIndex: 0 | 1 | 2, itemId?: number) => void
  setAccessorySlot: (id: string, slotIndex: number, itemId?: number) => void
  removeLoadout: (id: string) => void
  setActive: (id: string) => void
  duplicateLoadout: (id: string) => void
}

type PersistedBuildState = {
  loadouts?: unknown
  activeLoadoutId?: unknown
}

type LegacyLoadout = {
  id?: unknown
  name?: unknown
  class?: unknown
  slots?: {
    armor?: unknown[]
    accessories?: unknown[]
    weapon?: unknown
  }
}

const STORAGE_NAME = 'terraria-build-planner'
const STORAGE_VERSION = 1
const ACCESSORY_SLOT_COUNT = 5
const itemIdByName = new Map(items.map((item) => [item.name.toLowerCase(), item.id]))

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

const defaultSlots = (): LoadoutSlots => ({
  armor: [undefined, undefined, undefined],
  accessories: Array.from({ length: ACCESSORY_SLOT_COUNT }, () => undefined),
  weapon: undefined,
})

function cloneSlots(slots: LoadoutSlots): LoadoutSlots {
  return {
    armor: [...slots.armor] as LoadoutSlots['armor'],
    accessories: [...slots.accessories],
    weapon: slots.weapon,
  }
}

function normalizeItemId(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return itemsById.has(value) ? value : undefined
  }

  if (typeof value === 'string') {
    return itemIdByName.get(value.toLowerCase())
  }

  return undefined
}

function mergeSlots(slots?: Partial<LoadoutSlots>): LoadoutSlots {
  const base = defaultSlots()

  if (!slots) {
    return base
  }

  return {
    armor: [
      slots.armor?.[0] ?? base.armor[0],
      slots.armor?.[1] ?? base.armor[1],
      slots.armor?.[2] ?? base.armor[2],
    ],
    accessories: base.accessories.map((fallback, index) => slots.accessories?.[index] ?? fallback),
    weapon: slots.weapon ?? base.weapon,
  }
}

function normalizeLegacyLoadout(candidate: LegacyLoadout): Loadout | null {
  if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') {
    return null
  }

  if (
    candidate.class !== 'melee' &&
    candidate.class !== 'ranged' &&
    candidate.class !== 'magic' &&
    candidate.class !== 'summoner'
  ) {
    return null
  }

  const armor = Array.isArray(candidate.slots?.armor) ? candidate.slots?.armor : []
  const accessories = Array.isArray(candidate.slots?.accessories) ? candidate.slots?.accessories : []

  return {
    id: candidate.id,
    name: candidate.name,
    class: candidate.class,
    slots: {
      armor: [
        normalizeItemId(armor[0]),
        normalizeItemId(armor[1]),
        normalizeItemId(armor[2]),
      ],
      accessories: Array.from({ length: ACCESSORY_SLOT_COUNT }, (_, index) => normalizeItemId(accessories[index])),
      weapon: normalizeItemId(candidate.slots?.weapon),
    },
  }
}

function setLoadoutSlots(loadout: Loadout, recipe: (slots: LoadoutSlots) => void): Loadout {
  const nextSlots = cloneSlots(loadout.slots)
  recipe(nextSlots)

  return {
    ...loadout,
    slots: nextSlots,
  }
}

export const useBuildStore = create<BuildState>()(
  persist(
    (set, get) => ({
      loadouts: [],
      activeLoadoutId: null,
      createLoadout: ({ name, class: buildClass, slots }) => {
        const id = makeId()
        set((state) => ({
          loadouts: [...state.loadouts, { id, name, class: buildClass, slots: mergeSlots(slots) }],
          activeLoadoutId: id,
        }))
        return id
      },
      addLoadout: (loadout) => {
        const id = makeId()
        set((state) => ({
          loadouts: [...state.loadouts, { ...loadout, id, slots: mergeSlots(loadout.slots) }],
          activeLoadoutId: id,
        }))
        return id
      },
      mergeLoadouts: (incomingLoadouts, preferredActiveLoadoutId) =>
        set((state) => {
          const next = [...state.loadouts]

          for (const incoming of incomingLoadouts) {
            const normalizedIncoming = {
              ...incoming,
              slots: mergeSlots(incoming.slots),
            }
            const existingIndex = next.findIndex((loadout) => loadout.id === normalizedIncoming.id)

            if (existingIndex >= 0) {
              next[existingIndex] = normalizedIncoming
            } else {
              next.push(normalizedIncoming)
            }
          }

          const activeLoadoutId =
            typeof preferredActiveLoadoutId === 'string' && next.some((loadout) => loadout.id === preferredActiveLoadoutId)
              ? preferredActiveLoadoutId
              : typeof state.activeLoadoutId === 'string' && next.some((loadout) => loadout.id === state.activeLoadoutId)
                ? state.activeLoadoutId
                : next[0]?.id ?? null

          return {
            loadouts: next,
            activeLoadoutId,
          }
        }),
      updateLoadout: (id, patch) =>
        set((state) => ({
          loadouts: state.loadouts.map((loadout) => {
            if (loadout.id !== id) {
              return loadout
            }

            return {
              ...loadout,
              ...patch,
              slots: patch.slots ? mergeSlots(patch.slots) : loadout.slots,
            }
          }),
        })),
      renameLoadout: (id, name) =>
        set((state) => ({
          loadouts: state.loadouts.map((loadout) => (loadout.id === id ? { ...loadout, name } : loadout)),
        })),
      updateLoadoutClass: (id, buildClass) =>
        set((state) => ({
          loadouts: state.loadouts.map((loadout) =>
            loadout.id === id ? { ...loadout, class: buildClass } : loadout
          ),
        })),
      setWeapon: (id, itemId) =>
        set((state) => ({
          loadouts: state.loadouts.map((loadout) =>
            loadout.id === id ? setLoadoutSlots(loadout, (slots) => { slots.weapon = itemId }) : loadout
          ),
        })),
      setArmorSlot: (id, slotIndex, itemId) =>
        set((state) => ({
          loadouts: state.loadouts.map((loadout) =>
            loadout.id === id
              ? setLoadoutSlots(loadout, (slots) => { slots.armor[slotIndex] = itemId })
              : loadout
          ),
        })),
      setAccessorySlot: (id, slotIndex, itemId) =>
        set((state) => ({
          loadouts: state.loadouts.map((loadout) => {
            if (loadout.id !== id || slotIndex < 0 || slotIndex >= loadout.slots.accessories.length) {
              return loadout
            }

            return setLoadoutSlots(loadout, (slots) => {
              slots.accessories[slotIndex] = itemId
            })
          }),
        })),
      removeLoadout: (id) =>
        set((state) => {
          const remaining = state.loadouts.filter((l) => l.id !== id)
          return {
            loadouts: remaining,
            activeLoadoutId: remaining.length > 0 ? remaining[0].id : null,
          }
        }),
      setActive: (id) => set({ activeLoadoutId: id }),
      duplicateLoadout: (id) => {
        const loadout = get().loadouts.find((l) => l.id === id)
        if (!loadout) return
        const newId = makeId()
        set((state) => ({
          loadouts: [
            ...state.loadouts,
            {
              ...loadout,
              id: newId,
              name: `${loadout.name} (copy)`,
              slots: cloneSlots(loadout.slots),
            },
          ],
          activeLoadoutId: newId,
        }))
      },
    }),
    {
      name: STORAGE_NAME,
      version: STORAGE_VERSION,
      partialize: (state) => ({
        loadouts: state.loadouts,
        activeLoadoutId: state.activeLoadoutId,
      }),
      migrate: (persistedState) => {
        const candidate = persistedState as PersistedBuildState
        const nextLoadouts = Array.isArray(candidate.loadouts)
          ? candidate.loadouts
              .map((loadout) => normalizeLegacyLoadout(loadout as LegacyLoadout))
              .filter((loadout): loadout is Loadout => loadout !== null)
          : []
        const activeLoadoutId =
          typeof candidate.activeLoadoutId === 'string' && nextLoadouts.some((loadout) => loadout.id === candidate.activeLoadoutId)
            ? candidate.activeLoadoutId
            : nextLoadouts[0]?.id ?? null

        return {
          loadouts: nextLoadouts,
          activeLoadoutId,
        }
      },
    }
  )
)

export { defaultSlots }
