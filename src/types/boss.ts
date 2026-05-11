export type GamePhase = 'pre-hardmode' | 'hardmode' | 'post-moonlord'
export type BuildClass = 'melee' | 'ranged' | 'magic' | 'summoner'
export type PrepChecklistKey = 'arena' | 'buffs' | 'summon' | 'mobility'

export interface BossPrepChecklist {
  arena: boolean
  buffs: boolean
  summon: boolean
  mobility: boolean
}

export interface BossStrategySections {
  arena: string
  mobility: string
  buffs: string
  dangerWindows: string
  execution: string
}

export interface BossGear {
  class: BuildClass
  armor: number[]
  weapons: number[]
  accessories: number[]
  alternate?: {
    armor?: number[]
    weapons?: number[]
    accessories?: number[]
  }
}

export interface Boss {
  id: string
  name: string
  phase: GamePhase
  order: number
  summonItem?: string
  summonCondition?: string
  drops: string[]
  recommendedGear: BossGear[]
  strategy: string
  strategySections?: BossStrategySections
  tips: string[]
}
