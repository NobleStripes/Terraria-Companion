export interface NpcHappiness {
  lovedBiomes: string[]
  likedBiomes: string[]
  dislikedBiomes: string[]
  hatedBiomes: string[]
  lovedNeighbors: string[]
  likedNeighbors: string[]
  dislikedNeighbors: string[]
  hatedNeighbors: string[]
}

export interface Npc {
  id: string
  name: string
  description: string
  unlockCondition: string
  sells: string[]
  happiness: NpcHappiness
  housingRequirements: string
}
