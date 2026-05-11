import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRecipePlan } from '../src/lib/recipePlanner.ts'

function makeRecipeMap(entries: Array<[number, any[]]>) {
  return new Map<number, any[]>(entries)
}

test('planner strategy fewest-steps prefers shorter craft chains', () => {
  const targetId = 990000
  const craftedIngredient = 990001

  const recipesByResult = makeRecipeMap([
    [
      targetId,
      [
        {
          id: 5001,
          resultItemId: targetId,
          resultQuantity: 1,
          ingredients: [{ itemId: craftedIngredient, quantity: 1 }],
          station: 'Workbench',
        },
        {
          id: 5002,
          resultItemId: targetId,
          resultQuantity: 1,
          ingredients: [{ itemId: 990002, quantity: 1 }],
          station: 'Anvil',
        },
      ],
    ],
    [
      craftedIngredient,
      [
        {
          id: 5003,
          resultItemId: craftedIngredient,
          resultQuantity: 1,
          ingredients: [{ itemId: 990003, quantity: 1 }],
          station: 'Furnace',
        },
      ],
    ],
  ])

  const plan = buildRecipePlan(targetId, {
    strategy: 'fewest-steps',
    maxDepth: 6,
    recipesByResult,
  })

  assert.equal(plan.root.recipe?.id, 5002)
  assert.equal(plan.craftedSteps, 1)
})

test('planner strategy fewest-stations beats first-recipe fallback when steps tie', () => {
  const targetId = 991000

  const recipesByResult = makeRecipeMap([
    [
      targetId,
      [
        {
          id: 6001,
          resultItemId: targetId,
          resultQuantity: 1,
          ingredients: [{ itemId: 991001, quantity: 1 }],
          station: 'Workbench',
        },
        {
          id: 6002,
          resultItemId: targetId,
          resultQuantity: 1,
          ingredients: [{ itemId: 991002, quantity: 1 }],
          station: 'Workbench',
        },
      ],
    ],
    [
      991001,
      [
        {
          id: 6003,
          resultItemId: 991001,
          resultQuantity: 1,
          ingredients: [{ itemId: 991003, quantity: 1 }],
          station: 'Anvil',
        },
      ],
    ],
    [
      991002,
      [
        {
          id: 6004,
          resultItemId: 991002,
          resultQuantity: 1,
          ingredients: [{ itemId: 991004, quantity: 1 }],
          station: 'Workbench',
        },
      ],
    ],
  ])

  const fallbackPlan = buildRecipePlan(targetId, {
    strategy: 'first-recipe',
    maxDepth: 6,
    recipesByResult,
  })
  const stationPlan = buildRecipePlan(targetId, {
    strategy: 'fewest-stations',
    maxDepth: 6,
    recipesByResult,
  })

  assert.equal(fallbackPlan.root.recipe?.id, 6001)
  assert.equal(stationPlan.root.recipe?.id, 6002)
  assert.equal(stationPlan.stations.length, 1)
  assert.equal(fallbackPlan.stations.length, 2)
})
