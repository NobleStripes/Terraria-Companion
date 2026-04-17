export type GamePhase = 'pre-hardmode' | 'hardmode' | 'post-moonlord'
export type BuildClass = 'melee' | 'ranged' | 'magic' | 'summoner'

export interface BossGear {
  class: BuildClass
  armor: string[]
  weapons: string[]
  accessories: string[]
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
  tips: string[]
}
