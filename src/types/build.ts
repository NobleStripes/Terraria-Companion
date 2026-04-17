import type { BuildClass } from '@/types/boss'

export type WorldEvil = 'corruption' | 'crimson'
export type Difficulty = 'classic' | 'expert' | 'master'

export const stageOrder = ['Early Game', 'Pre-Hardmode', 'Early Hardmode', 'Endgame'] as const
export type StageName = (typeof stageOrder)[number]

export interface StageRecommendation {
  stage: StageName
  armor: string
  weapon: string
  accessories: string[]
  note: string
  why?: string[]
}

export interface BuildFilters {
  worldEvil: WorldEvil
  difficulty: Difficulty
  progressionCap: StageName
}

export interface StageAdjustmentRule {
  applyIf?: {
    stages?: StageName[]
    excludeStages?: StageName[]
  }
  replaceAccessories?: Record<string, string>
  replaceWeapons?: Record<string, string>
  addAccessoriesAtStart?: string[]
  limitAccessories?: number
  appendNote?: string
  addWhyBullets?: string[]
  adjustmentLabel?: string
}

export interface ResolvedStageRecommendation extends StageRecommendation {
  why: string[]
  adjustments: string[]
}

export type StagedBuildsByClass = Record<BuildClass, StageRecommendation[]>
