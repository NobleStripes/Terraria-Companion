import type { Boss, BuildClass } from '@/types/boss'
import type { StageName } from '@/types/build'
import type { Biome } from '@/types/biome'
import type { Npc } from '@/types/npc'
import type { Item } from '@/types/item'

export type SessionGoalKind = 'boss' | 'build' | 'wishlist' | 'npc' | 'biome'

export interface SessionGoal {
  id: string
  kind: SessionGoalKind
  title: string
  reason: string
  score: number
  route: string
}

export interface SessionPlanSummary {
  defeatedBosses: number
  totalBosses: number
  prepReadyBosses: number
  missingBuildItems: number
  wishedDrops: number
}

export interface SessionPlan {
  generatedAt: string
  headline: string
  goals: SessionGoal[]
  summary: SessionPlanSummary
}

export interface SessionPlannerInput {
  bosses: Boss[]
  defeatedBossIds: Set<string>
  prepCompletionByBossId: Record<string, { completed: number; total: number }>
  activeBuildClass: BuildClass
  currentStage: StageName
  stageArmor: string
  stageWeapon: string
  stageAccessories: string[]
  equippedItemNames: string[]
  wishedDrops: string[]
  items: Item[]
  npcs: Npc[]
  biomes: Biome[]
}
