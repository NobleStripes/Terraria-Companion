import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BuildClass } from '@/types/boss'

export interface LoadoutSlots {
  armor: [string?, string?, string?]
  accessories: (string | undefined)[]
  weapon?: string
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
  addLoadout: (loadout: Omit<Loadout, 'id'>) => void
  updateLoadout: (id: string, patch: Partial<Loadout>) => void
  removeLoadout: (id: string) => void
  setActive: (id: string) => void
  duplicateLoadout: (id: string) => void
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

const defaultSlots = (): LoadoutSlots => ({
  armor: [undefined, undefined, undefined],
  accessories: [undefined, undefined, undefined, undefined, undefined],
  weapon: undefined,
})

export const useBuildStore = create<BuildState>()(
  persist(
    (set, get) => ({
      loadouts: [],
      activeLoadoutId: null,
      addLoadout: (loadout) => {
        const id = makeId()
        set((state) => ({
          loadouts: [...state.loadouts, { ...loadout, id }],
          activeLoadoutId: id,
        }))
      },
      updateLoadout: (id, patch) =>
        set((state) => ({
          loadouts: state.loadouts.map((l) => (l.id === id ? { ...l, ...patch } : l)),
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
            { ...loadout, id: newId, name: `${loadout.name} (copy)` },
          ],
          activeLoadoutId: newId,
        }))
      },
    }),
    {
      name: 'terraria-build-planner',
    }
  )
)

export { defaultSlots }
