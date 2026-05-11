import { useMemo } from 'react'
import { buildRecipePlan, type RecipePlanStrategy } from '@/lib/recipePlanner'
import { itemsById, recipesByResult } from '@/data/index'

interface UseRecipePlannerOptions {
  maxDepth?: number
  strategy?: RecipePlanStrategy
}

export function useRecipePlanner(itemId: number | undefined, options: UseRecipePlannerOptions = {}) {
  const { maxDepth = 5, strategy = 'first-recipe' } = options

  return useMemo(() => {
    if (itemId === undefined) {
      return null
    }

    return buildRecipePlan(itemId, {
      maxDepth,
      strategy,
      recipesByResult,
      getItemName: (id) => itemsById.get(id)?.name,
    })
  }, [itemId, maxDepth, strategy])
}
