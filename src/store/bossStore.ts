import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BossDropStatus, BossPrepChecklist, PrepChecklistKey } from '@/types/boss'

type PersistedBossState = {
  defeatedBosses?: unknown
  prepChecklistByBoss?: unknown
  dropStatusByBoss?: unknown
}

const STORAGE_NAME = 'terraria-boss-tracker'
const STORAGE_VERSION = 1

const checklistKeys: PrepChecklistKey[] = ['arena', 'buffs', 'summon', 'mobility']
const trackedDropStatuses: BossDropStatus[] = ['wished', 'acquired']

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

function normalizeDropStatus(candidate: unknown): BossDropStatus {
  if (candidate === 'wished' || candidate === 'acquired') {
    return candidate
  }

  return 'none'
}

interface BossState {
  defeatedBosses: string[]
  prepChecklistByBoss: Record<string, BossPrepChecklist>
  dropStatusByBoss: Record<string, Record<string, BossDropStatus>>
  toggleBoss: (id: string) => void
  togglePrepItem: (bossId: string, key: PrepChecklistKey) => void
  setPrepAllForBoss: (bossId: string) => void
  resetPrepForBoss: (bossId: string) => void
  resetPrepAll: () => void
  setDropStatus: (bossId: string, dropName: string, status: BossDropStatus) => void
  toggleDropWish: (bossId: string, dropName: string) => void
  toggleDropAcquired: (bossId: string, dropName: string) => void
  clearDropStatus: (bossId: string, dropName: string) => void
  resetDropsForBoss: (bossId: string) => void
  resetDropsAll: () => void
  resetAll: () => void
  isDefeated: (id: string) => boolean
  getPrepChecklist: (bossId: string) => BossPrepChecklist
  getPrepCompletion: (bossId: string) => { completed: number; total: number }
  isPrepReady: (bossId: string) => boolean
  getDropStatus: (bossId: string, dropName: string) => BossDropStatus
  getBossDropCounts: (bossId: string, dropNames: string[]) => { wished: number; acquired: number; missing: number; total: number }
  getTrackedDropNames: (status?: 'wished' | 'acquired') => string[]
}

export const useBossStore = create<BossState>()(
  persist(
    (set, get) => ({
      defeatedBosses: [],
      prepChecklistByBoss: {},
      dropStatusByBoss: {},
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
      setPrepAllForBoss: (bossId) =>
        set((state) => ({
          prepChecklistByBoss: {
            ...state.prepChecklistByBoss,
            [bossId]: {
              arena: true,
              buffs: true,
              summon: true,
              mobility: true,
            },
          },
        })),
      resetPrepForBoss: (bossId) =>
        set((state) => ({
          prepChecklistByBoss: {
            ...state.prepChecklistByBoss,
            [bossId]: defaultChecklist(),
          },
        })),
      resetPrepAll: () => set({ prepChecklistByBoss: {} }),
      setDropStatus: (bossId, dropName, status) =>
        set((state) => {
          const normalizedDrop = dropName.trim()

          if (!normalizedDrop) {
            return state
          }

          const existingBossDrops = state.dropStatusByBoss[bossId] ?? {}
          const nextBossDrops = { ...existingBossDrops }

          if (status === 'none') {
            delete nextBossDrops[normalizedDrop]
          } else {
            nextBossDrops[normalizedDrop] = status
          }

          const nextDropStatusByBoss = { ...state.dropStatusByBoss }

          if (Object.keys(nextBossDrops).length === 0) {
            delete nextDropStatusByBoss[bossId]
          } else {
            nextDropStatusByBoss[bossId] = nextBossDrops
          }

          return {
            dropStatusByBoss: nextDropStatusByBoss,
          }
        }),
      toggleDropWish: (bossId, dropName) => {
        const current = get().getDropStatus(bossId, dropName)
        get().setDropStatus(bossId, dropName, current === 'wished' ? 'none' : 'wished')
      },
      toggleDropAcquired: (bossId, dropName) => {
        const current = get().getDropStatus(bossId, dropName)
        get().setDropStatus(bossId, dropName, current === 'acquired' ? 'none' : 'acquired')
      },
      clearDropStatus: (bossId, dropName) => get().setDropStatus(bossId, dropName, 'none'),
      resetDropsForBoss: (bossId) =>
        set((state) => {
          if (!(bossId in state.dropStatusByBoss)) {
            return state
          }

          const nextDropStatusByBoss = { ...state.dropStatusByBoss }
          delete nextDropStatusByBoss[bossId]

          return {
            dropStatusByBoss: nextDropStatusByBoss,
          }
        }),
      resetDropsAll: () => set({ dropStatusByBoss: {} }),
      resetAll: () => set({ defeatedBosses: [], prepChecklistByBoss: {}, dropStatusByBoss: {} }),
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
      getDropStatus: (bossId, dropName) => {
        const normalizedDrop = dropName.trim()
        if (!normalizedDrop) {
          return 'none'
        }

        return get().dropStatusByBoss[bossId]?.[normalizedDrop] ?? 'none'
      },
      getBossDropCounts: (bossId, dropNames) => {
        const normalizedDropNames = Array.from(new Set(dropNames.map((dropName) => dropName.trim()).filter(Boolean)))
        const statuses = get().dropStatusByBoss[bossId] ?? {}
        const wished = normalizedDropNames.filter((dropName) => statuses[dropName] === 'wished').length
        const acquired = normalizedDropNames.filter((dropName) => statuses[dropName] === 'acquired').length

        return {
          wished,
          acquired,
          missing: Math.max(wished - acquired, 0),
          total: normalizedDropNames.length,
        }
      },
      getTrackedDropNames: (status) => {
        const dropNames = new Set<string>()

        for (const bossDrops of Object.values(get().dropStatusByBoss)) {
          for (const [dropName, dropStatus] of Object.entries(bossDrops)) {
            if (!trackedDropStatuses.includes(dropStatus)) {
              continue
            }

            if (!status || dropStatus === status) {
              dropNames.add(dropName)
            }
          }
        }

        return Array.from(dropNames)
      },
    }),
    {
      name: STORAGE_NAME,
      version: STORAGE_VERSION,
      partialize: (state) => ({
        defeatedBosses: state.defeatedBosses,
        prepChecklistByBoss: state.prepChecklistByBoss,
        dropStatusByBoss: state.dropStatusByBoss,
      }),
      migrate: (persistedState) => {
        const candidate = persistedState as PersistedBossState
        const defeatedBosses = Array.isArray(candidate.defeatedBosses)
          ? candidate.defeatedBosses.filter((bossId): bossId is string => typeof bossId === 'string')
          : []

        const prepChecklistByBoss: Record<string, BossPrepChecklist> = {}
        const maybeChecklistMap = candidate.prepChecklistByBoss
        const dropStatusByBoss: Record<string, Record<string, BossDropStatus>> = {}

        if (maybeChecklistMap && typeof maybeChecklistMap === 'object') {
          for (const [bossId, checklist] of Object.entries(maybeChecklistMap as Record<string, unknown>)) {
            prepChecklistByBoss[bossId] = normalizeChecklist(checklist)
          }
        }

        if (candidate.dropStatusByBoss && typeof candidate.dropStatusByBoss === 'object') {
          for (const [bossId, drops] of Object.entries(candidate.dropStatusByBoss as Record<string, unknown>)) {
            if (!drops || typeof drops !== 'object') {
              continue
            }

            const normalizedBossDrops: Record<string, BossDropStatus> = {}

            for (const [dropName, status] of Object.entries(drops as Record<string, unknown>)) {
              const normalizedName = dropName.trim()
              const normalizedStatus = normalizeDropStatus(status)

              if (!normalizedName || normalizedStatus === 'none') {
                continue
              }

              normalizedBossDrops[normalizedName] = normalizedStatus
            }

            if (Object.keys(normalizedBossDrops).length > 0) {
              dropStatusByBoss[bossId] = normalizedBossDrops
            }
          }
        }

        return {
          defeatedBosses,
          prepChecklistByBoss,
          dropStatusByBoss,
        }
      },
    }
  )
)
