import { itemsById, recipesByResult } from '@/data/index'
import type { Recipe } from '@/types/recipe'

export interface RecipePlanNode {
  itemId: number
  quantityNeeded: number
  recipe: Recipe | null
  reason?: 'no-recipe' | 'depth-limit' | 'cycle'
  ingredients: RecipePlanNode[]
}

export interface RecipePlanLeafTotal {
  itemId: number
  quantity: number
}

export interface RecipePlan {
  targetItemId: number
  maxDepth: number
  root: RecipePlanNode
  leafTotals: RecipePlanLeafTotal[]
  stations: Array<{ station: string; steps: number }>
  craftedSteps: number
  cycleDetected: boolean
}

export interface BuildRecipePlanOptions {
  maxDepth?: number
}

const DEFAULT_MAX_DEPTH = 5

function addLeafTotal(map: Map<number, number>, itemId: number, quantity: number) {
  map.set(itemId, (map.get(itemId) ?? 0) + quantity)
}

function addStationCount(map: Map<string, number>, station: string) {
  map.set(station, (map.get(station) ?? 0) + 1)
}

function chooseRecipe(recipes: Recipe[]): Recipe {
  return recipes[0]
}

function toSortedLeafTotals(totals: Map<number, number>): RecipePlanLeafTotal[] {
  return Array.from(totals.entries())
    .map(([itemId, quantity]) => ({ itemId, quantity }))
    .sort((a, b) => {
      const left = itemsById.get(a.itemId)?.name ?? ''
      const right = itemsById.get(b.itemId)?.name ?? ''
      return left.localeCompare(right)
    })
}

export function buildRecipePlan(targetItemId: number, options: BuildRecipePlanOptions = {}): RecipePlan {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH
  const leafTotals = new Map<number, number>()
  const stationCounts = new Map<string, number>()

  let craftedSteps = 0
  let cycleDetected = false

  function walk(itemId: number, quantityNeeded: number, depth: number, trail: Set<number>): RecipePlanNode {
    if (trail.has(itemId)) {
      cycleDetected = true
      addLeafTotal(leafTotals, itemId, quantityNeeded)
      return {
        itemId,
        quantityNeeded,
        recipe: null,
        reason: 'cycle',
        ingredients: [],
      }
    }

    const candidateRecipes = recipesByResult.get(itemId) ?? []

    if (candidateRecipes.length === 0) {
      addLeafTotal(leafTotals, itemId, quantityNeeded)
      return {
        itemId,
        quantityNeeded,
        recipe: null,
        reason: 'no-recipe',
        ingredients: [],
      }
    }

    if (depth >= maxDepth) {
      addLeafTotal(leafTotals, itemId, quantityNeeded)
      return {
        itemId,
        quantityNeeded,
        recipe: null,
        reason: 'depth-limit',
        ingredients: [],
      }
    }

    const recipe = chooseRecipe(candidateRecipes)
    const multiplier = Math.ceil(quantityNeeded / recipe.resultQuantity)
    const nextTrail = new Set(trail)
    nextTrail.add(itemId)

    const ingredients = recipe.ingredients.map((ingredient) =>
      walk(ingredient.itemId, ingredient.quantity * multiplier, depth + 1, nextTrail)
    )

    craftedSteps += 1
    addStationCount(stationCounts, recipe.station)

    return {
      itemId,
      quantityNeeded,
      recipe,
      ingredients,
    }
  }

  const root = walk(targetItemId, 1, 0, new Set<number>())

  return {
    targetItemId,
    maxDepth,
    root,
    leafTotals: toSortedLeafTotals(leafTotals),
    stations: Array.from(stationCounts.entries())
      .map(([station, steps]) => ({ station, steps }))
      .sort((a, b) => b.steps - a.steps || a.station.localeCompare(b.station)),
    craftedSteps,
    cycleDetected,
  }
}
