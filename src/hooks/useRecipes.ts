import { recipesByResult, recipesByIngredient } from '@/data/index'
import type { Recipe } from '@/types/recipe'

export function useRecipesForItem(itemId: number | undefined): { crafts: Recipe[]; usedIn: Recipe[] } {
  if (itemId === undefined) return { crafts: [], usedIn: [] }
  return {
    crafts: recipesByResult.get(itemId) ?? [],
    usedIn: recipesByIngredient.get(itemId) ?? [],
  }
}
