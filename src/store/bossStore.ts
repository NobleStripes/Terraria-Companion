import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BossState {
  defeatedBosses: string[]
  toggleBoss: (id: string) => void
  resetAll: () => void
  isDefeated: (id: string) => boolean
}

export const useBossStore = create<BossState>()(
  persist(
    (set, get) => ({
      defeatedBosses: [],
      toggleBoss: (id) =>
        set((state) => ({
          defeatedBosses: state.defeatedBosses.includes(id)
            ? state.defeatedBosses.filter((b) => b !== id)
            : [...state.defeatedBosses, id],
        })),
      resetAll: () => set({ defeatedBosses: [] }),
      isDefeated: (id) => get().defeatedBosses.includes(id),
    }),
    {
      name: 'terraria-boss-tracker',
    }
  )
)
