export interface Biome {
  id: string
  name: string
  description: string
  layer: 'surface' | 'underground' | 'cavern' | 'sky' | 'underworld'
  hardmodeOnly: boolean
  resources: string[]
  commonEnemies: string[]
  uniqueFeatures: string[]
  happyNpcs: string[]
}
