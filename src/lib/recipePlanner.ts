import type { Recipe } from '../types/recipe.ts'

export type RecipePlanStrategy = 'first-recipe' | 'fewest-steps' | 'fewest-stations'

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
  strategy: RecipePlanStrategy
  root: RecipePlanNode
  leafTotals: RecipePlanLeafTotal[]
  stations: Array<{ station: string; steps: number }>
  craftedSteps: number
  cycleDetected: boolean
}

export interface BuildRecipePlanOptions {
  maxDepth?: number
  strategy?: RecipePlanStrategy
  recipesByResult: Map<number, Recipe[]>
  getItemName?: (itemId: number) => string | undefined
}

interface PlanEval {
  node: RecipePlanNode
  craftedSteps: number
  stationCounts: Map<string, number>
  cycleDetected: boolean
}

const DEFAULT_MAX_DEPTH = 5
const DEFAULT_STRATEGY: RecipePlanStrategy = 'first-recipe'

function addStationCount(map: Map<string, number>, station: string, amount = 1) {
  map.set(station, (map.get(station) ?? 0) + amount)
}

function mergeStationCounts(base: Map<string, number>, extra: Map<string, number>) {
  const next = new Map(base)

  for (const [station, count] of extra.entries()) {
    addStationCount(next, station, count)
  }

  return next
}

function collectLeafTotals(node: RecipePlanNode, totals: Map<number, number>) {
  if (node.ingredients.length === 0) {
    totals.set(node.itemId, (totals.get(node.itemId) ?? 0) + node.quantityNeeded)
    return
  }

  for (const ingredient of node.ingredients) {
    collectLeafTotals(ingredient, totals)
  }
}

function toSortedLeafTotals(totals: Map<number, number>, getItemName?: (itemId: number) => string | undefined): RecipePlanLeafTotal[] {
  return Array.from(totals.entries())
    .map(([itemId, quantity]) => ({ itemId, quantity }))
    .sort((a, b) => {
      const left = getItemName?.(a.itemId) ?? ''
      const right = getItemName?.(b.itemId) ?? ''
      return left.localeCompare(right)
    })
}

function countUniqueStations(stations: Map<string, number>): number {
  return stations.size
}

function compareEvaluations(left: { eval: PlanEval; recipeId: number }, right: { eval: PlanEval; recipeId: number }, strategy: RecipePlanStrategy) {
  if (left.eval.cycleDetected !== right.eval.cycleDetected) {
    return left.eval.cycleDetected ? 1 : -1
  }

  const leftStationTypes = countUniqueStations(left.eval.stationCounts)
  const rightStationTypes = countUniqueStations(right.eval.stationCounts)

  if (strategy === 'fewest-stations') {
    if (leftStationTypes !== rightStationTypes) {
      return leftStationTypes - rightStationTypes
    }

    if (left.eval.craftedSteps !== right.eval.craftedSteps) {
      return left.eval.craftedSteps - right.eval.craftedSteps
    }
  } else {
    if (left.eval.craftedSteps !== right.eval.craftedSteps) {
      return left.eval.craftedSteps - right.eval.craftedSteps
    }

    if (leftStationTypes !== rightStationTypes) {
      return leftStationTypes - rightStationTypes
    }
  }

  return left.recipeId - right.recipeId
}

function chooseRecipeEvaluation(
  evaluations: Array<{ eval: PlanEval; recipeId: number }>,
  strategy: RecipePlanStrategy
): PlanEval {
  if (strategy === 'first-recipe') {
    return evaluations[0].eval
  }

  const sorted = [...evaluations].sort((a, b) => compareEvaluations(a, b, strategy))
  return sorted[0].eval
}

export function buildRecipePlan(targetItemId: number, options: BuildRecipePlanOptions): RecipePlan {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH
  const strategy = options.strategy ?? DEFAULT_STRATEGY

  function walk(itemId: number, quantityNeeded: number, depth: number, trail: Set<number>): PlanEval {
    if (trail.has(itemId)) {
      return {
        node: {
          itemId,
          quantityNeeded,
          recipe: null,
          reason: 'cycle',
          ingredients: [],
        },
        craftedSteps: 0,
        stationCounts: new Map(),
        cycleDetected: true,
      }
    }

    const candidateRecipes = options.recipesByResult.get(itemId) ?? []

    if (candidateRecipes.length === 0) {
      return {
        node: {
          itemId,
          quantityNeeded,
          recipe: null,
          reason: 'no-recipe',
          ingredients: [],
        },
        craftedSteps: 0,
        stationCounts: new Map(),
        cycleDetected: false,
      }
    }

    if (depth >= maxDepth) {
      return {
        node: {
          itemId,
          quantityNeeded,
          recipe: null,
          reason: 'depth-limit',
          ingredients: [],
        },
        craftedSteps: 0,
        stationCounts: new Map(),
        cycleDetected: false,
      }
    }

    const nextTrail = new Set(trail)
    nextTrail.add(itemId)

    const evaluations = candidateRecipes.map((recipe) => {
      const multiplier = Math.ceil(quantityNeeded / recipe.resultQuantity)
      const childEvals = recipe.ingredients.map((ingredient) =>
        walk(ingredient.itemId, ingredient.quantity * multiplier, depth + 1, nextTrail)
      )

      let stationCounts = new Map<string, number>()
      let craftedSteps = 1
      let cycleDetected = false

      for (const childEval of childEvals) {
        stationCounts = mergeStationCounts(stationCounts, childEval.stationCounts)
        craftedSteps += childEval.craftedSteps
        if (childEval.cycleDetected) {
          cycleDetected = true
        }
      }

      addStationCount(stationCounts, recipe.station)

      return {
        recipeId: recipe.id,
        eval: {
          node: {
            itemId,
            quantityNeeded,
            recipe,
            ingredients: childEvals.map((childEval) => childEval.node),
          },
          craftedSteps,
          stationCounts,
          cycleDetected,
        },
      }
    })

    return chooseRecipeEvaluation(evaluations, strategy)
  }

  const result = walk(targetItemId, 1, 0, new Set<number>())
  const leafTotals = new Map<number, number>()
  collectLeafTotals(result.node, leafTotals)

  return {
    targetItemId,
    maxDepth,
    strategy,
    root: result.node,
    leafTotals: toSortedLeafTotals(leafTotals, options.getItemName),
    stations: Array.from(result.stationCounts.entries())
      .map(([station, steps]) => ({ station, steps }))
      .sort((a, b) => b.steps - a.steps || a.station.localeCompare(b.station)),
    craftedSteps: result.craftedSteps,
    cycleDetected: result.cycleDetected,
  }
}
