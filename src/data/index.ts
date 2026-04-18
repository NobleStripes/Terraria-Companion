import type { Item } from '@/types/item'
import type { Recipe } from '@/types/recipe'
import type { Boss } from '@/types/boss'
import type { Npc } from '@/types/npc'
import type { Biome } from '@/types/biome'
import type { Prefix } from '@/types/prefix'

import itemsRaw from './items.json'
import recipesRaw from './recipes.json'
import bossesRaw from './bosses.json'
import npcsRaw from './npcs.json'
import biomesRaw from './biomes.json'
import prefixesRaw from './prefixes.json'
import changelogRaw from './changelog.json'

export const DATA_VERSION = '1.4.5.6'
export const APP_VERSION = '1.0.2'

export const items: Item[] = itemsRaw as Item[]
export const recipes: Recipe[] = recipesRaw as Recipe[]
export const bosses: Boss[] = bossesRaw as Boss[]
export const npcs: Npc[] = npcsRaw as Npc[]
export const biomes: Biome[] = biomesRaw as Biome[]
export const prefixes: Prefix[] = prefixesRaw as Prefix[]
export const changelog = changelogRaw as Array<{ version: string; date: string; highlights: string[] }>

export const itemsById = new Map<number, Item>(items.map((item) => [item.id, item]))
export const prefixesById = new Map<string, Prefix>(prefixes.map((prefix) => [prefix.id, prefix]))
export const recipesByResult = new Map<number, Recipe[]>()
export const recipesByIngredient = new Map<number, Recipe[]>()

for (const recipe of recipes) {
  const byResult = recipesByResult.get(recipe.resultItemId) ?? []
  byResult.push(recipe)
  recipesByResult.set(recipe.resultItemId, byResult)

  for (const ing of recipe.ingredients) {
    const byIng = recipesByIngredient.get(ing.itemId) ?? []
    byIng.push(recipe)
    recipesByIngredient.set(ing.itemId, byIng)
  }
}
