import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BossPrepChecklist, PrepChecklistKey } from '@/types/boss'

type PersistedBossState = {
  defeatedBosses?: unknown
  prepChecklistByBoss?: unknown
}

const STORAGE_NAME = 'terraria-boss-tracker'
const STORAGE_VERSION = 1

const checklistKeys: PrepChecklistKey[] = ['arena', 'buffs', 'summon', 'mobility']

function defaultChecklist(): BossPrepChecklist {
  return {
    arena: false,
    buffs: false,
    summon: false,
    mobility: false,
  }
}

function normalizeChecklist(candidate: unknown): BossPrepChecklist {
  const fallback = defaultChecklist()

  if (!candidate || typeof candidate !== 'object') {
    return fallback
  }

  const value = candidate as Partial<Record<PrepChecklistKey, unknown>>

  return {
    arena: Boolean(value.arena),
    buffs: Boolean(value.buffs),
    summon: Boolean(value.summon),
    mobility: Boolean(value.mobility),
  }
}

function countCompleted(checklist: BossPrepChecklist): number {
  return checklistKeys.filter((key) => checklist[key]).length
}

interface BossState {
  defeatedBosses: string[]
  prepChecklistByBoss: Record<string, BossPrepChecklist>
  toggleBoss: (id: string) => void
  togglePrepItem: (bossId: string, key: PrepChecklistKey) => void
  resetPrepForBoss: (bossId: string) => void
  resetPrepAll: () => void
  resetAll: () => void
  isDefeated: (id: string) => boolean
  getPrepChecklist: (bossId: string) => BossPrepChecklist
  getPrepCompletion: (bossId: string) => { completed: number; total: number }
  isPrepReady: (bossId: string) => boolean
}

export const useBossStore = create<BossState>()(
  persist(
    (set, get) => ({
      defeatedBosses: [],
      prepChecklistByBoss: {},
      toggleBoss: (id) =>
        set((state) => ({
          defeatedBosses: state.defeatedBosses.includes(id)
            ? state.defeatedBosses.filter((b) => b !== id)
            : [...state.defeatedBosses, id],
        })),
      togglePrepItem: (bossId, key) =>
        set((state) => {
          const existing = state.prepChecklistByBoss[bossId] ?? defaultChecklist()

          return {
            prepChecklistByBoss: {
              ...state.prepChecklistByBoss,
              [bossId]: {
                ...existing,
                [key]: !existing[key],
              },
            },
          }
        }),
      resetPrepForBoss: (bossId) =>
        set((state) => ({
          prepChecklistByBoss: {
            ...state.prepChecklistByBoss,
            [bossId]: defaultChecklist(),
          },
        })),
      resetPrepAll: () => set({ prepChecklistByBoss: {} }),
      resetAll: () => set({ defeatedBosses: [], prepChecklistByBoss: {} }),
      isDefeated: (id) => get().defeatedBosses.includes(id),
      getPrepChecklist: (bossId) => get().prepChecklistByBoss[bossId] ?? defaultChecklist(),
      getPrepCompletion: (bossId) => {
        const checklist = get().prepChecklistByBoss[bossId] ?? defaultChecklist()

        return {
          completed: countCompleted(checklist),
          total: checklistKeys.length,
        }
      },
      isPrepReady: (bossId) => {
        const checklist = get().prepChecklistByBoss[bossId] ?? defaultChecklist()
        return countCompleted(checklist) === checklistKeys.length
      },
    }),
    {
      name: STORAGE_NAME,
      version: STORAGE_VERSION,
      partialize: (state) => ({
        defeatedBosses: state.defeatedBosses,
        prepChecklistByBoss: state.prepChecklistByBoss,
      }),
      migrate: (persistedState) => {
        const candidate = persistedState as PersistedBossState
        const defeatedBosses = Array.isArray(candidate.defeatedBosses)
          ? candidate.defeatedBosses.filter((bossId): bossId is string => typeof bossId === 'string')
          : []

        const prepChecklistByBoss: Record<string, BossPrepChecklist> = {}
        const maybeChecklistMap = candidate.prepChecklistByBoss

        if (maybeChecklistMap && typeof maybeChecklistMap === 'object') {
          for (const [bossId, checklist] of Object.entries(maybeChecklistMap as Record<string, unknown>)) {
            prepChecklistByBoss[bossId] = normalizeChecklist(checklist)
          }
        }

        return {
          defeatedBosses,
          prepChecklistByBoss,
        }
      },
    }
  )
)
