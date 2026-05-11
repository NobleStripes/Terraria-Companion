import { useMemo } from 'react'
import { buildRecipePlan } from '@/lib/recipePlanner'

interface UseRecipePlannerOptions {
  maxDepth?: number
}

export function useRecipePlanner(itemId: number | undefined, options: UseRecipePlannerOptions = {}) {
  const { maxDepth = 5 } = options

  return useMemo(() => {
    if (itemId === undefined) {
      return null
    }

    return buildRecipePlan(itemId, { maxDepth })
  }, [itemId, maxDepth])
}
