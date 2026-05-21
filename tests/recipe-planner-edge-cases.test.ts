import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRecipePlan } from '../src/lib/recipePlanner.ts'
import type { Recipe } from '../src/types/recipe.ts'

function makeMap(entries: Array<[number, Recipe[]]>) {
  return new Map<number, Recipe[]>(entries)
}

function makeRecipe(overrides: Partial<Recipe> & { id: number; resultItemId: number }): Recipe {
  return {
    resultQuantity: 1,
    ingredients: [],
    station: 'Workbench',
    ...overrides,
  }
}

// --- no-recipe leaf ---

test('planner: item with no recipe returns no-recipe leaf with empty ingredients', () => {
  const plan = buildRecipePlan(9000, {
    recipesByResult: makeMap([]),
  })

  assert.equal(plan.root.reason, 'no-recipe')
  assert.equal(plan.root.recipe, null)
  assert.deepEqual(plan.root.ingredients, [])
  assert.equal(plan.craftedSteps, 0)
  assert.equal(plan.cycleDetected, false)
})

// --- depth limit ---

test('planner: depth limit stops recursion and marks node as depth-limit', () => {
  // Chain: A(7000) -> B(7001) -> C(7002) -> D(7003)
  // With maxDepth: 2, C should be resolved but D should hit depth-limit
  const plan = buildRecipePlan(7000, {
    maxDepth: 2,
    recipesByResult: makeMap([
      [7000, [makeRecipe({ id: 1, resultItemId: 7000, ingredients: [{ itemId: 7001, quantity: 1 }] })]],
      [7001, [makeRecipe({ id: 2, resultItemId: 7001, ingredients: [{ itemId: 7002, quantity: 1 }] })]],
      [7002, [makeRecipe({ id: 3, resultItemId: 7002, ingredients: [{ itemId: 7003, quantity: 1 }] })]],
      [7003, [makeRecipe({ id: 4, resultItemId: 7003, ingredients: [{ itemId: 7004, quantity: 1 }] })]],
    ]),
  })

  // Root (depth 0) → 7001 (depth 1) → 7002 (depth 2, at limit) → stops
  assert.equal(plan.root.recipe?.id, 1)
  const depthOneNode = plan.root.ingredients[0]
  assert.equal(depthOneNode.itemId, 7001)
  const depthTwoNode = depthOneNode.ingredients[0]
  assert.equal(depthTwoNode.itemId, 7002)
  assert.equal(depthTwoNode.reason, 'depth-limit')
  assert.deepEqual(depthTwoNode.ingredients, [])
})

// --- cycle detection ---

test('planner: cycle detection flags circular dependency', () => {
  // A(8000) needs B(8001), B needs A — creates a cycle
  const plan = buildRecipePlan(8000, {
    recipesByResult: makeMap([
      [8000, [makeRecipe({ id: 1, resultItemId: 8000, ingredients: [{ itemId: 8001, quantity: 1 }] })]],
      [8001, [makeRecipe({ id: 2, resultItemId: 8001, ingredients: [{ itemId: 8000, quantity: 1 }] })]],
    ]),
  })

  assert.equal(plan.cycleDetected, true)
  // The inner A node should have reason 'cycle'
  const bNode = plan.root.ingredients[0]
  assert.equal(bNode.itemId, 8001)
  const cycleNode = bNode.ingredients[0]
  assert.equal(cycleNode.itemId, 8000)
  assert.equal(cycleNode.reason, 'cycle')
})

// --- result quantity multiplier ---

test('planner: resultQuantity > 1 scales ingredient quantities via ceiling division', () => {
  // Recipe yields 3 of item 9100 per craft; we need 5 → ceil(5/3) = 2 crafts → 2 * wood quantity
  const plan = buildRecipePlan(9100, {
    recipesByResult: makeMap([
      [9100, [{
        id: 1,
        resultItemId: 9100,
        resultQuantity: 3,
        ingredients: [{ itemId: 9101, quantity: 4 }],
        station: 'Workbench',
      }]],
    ]),
    // need 5 of 9100
  })

  // The planner always requests quantity 1 at the root level, so multiplier = ceil(1/3) = 1
  // ingredient quantity = 1 * 4 = 4
  const leaf = plan.root.ingredients[0]
  assert.equal(leaf.itemId, 9101)
  assert.equal(leaf.quantityNeeded, 4)
})

test('planner: ingredient of ingredient has quantity scaled by parent multiplier', () => {
  // Recipe for 9200 needs 5 of 9201 (which yields 2 per craft, so mul = ceil(5/2) = 3)
  // 9201 recipe needs 2 of 9202, so total 9202 needed = 3*2 = 6
  const plan = buildRecipePlan(9200, {
    recipesByResult: makeMap([
      [9200, [{
        id: 1,
        resultItemId: 9200,
        resultQuantity: 1,
        ingredients: [{ itemId: 9201, quantity: 5 }],
        station: 'Workbench',
      }]],
      [9201, [{
        id: 2,
        resultItemId: 9201,
        resultQuantity: 2,
        ingredients: [{ itemId: 9202, quantity: 2 }],
        station: 'Furnace',
      }]],
    ]),
  })

  const node9201 = plan.root.ingredients[0]
  assert.equal(node9201.itemId, 9201)
  assert.equal(node9201.quantityNeeded, 5)

  const node9202 = node9201.ingredients[0]
  assert.equal(node9202.itemId, 9202)
  // ceil(5/2) = 3 crafts of 9201, each craft needs 2 of 9202, so 3*2 = 6
  assert.equal(node9202.quantityNeeded, 6)
})

// --- leaf total accumulation ---

test('planner: leaf totals accumulate shared ingredients across branches', () => {
  // 9300 needs 9301 and 9302; both 9301 and 9302 need 9303 (shared base material)
  const plan = buildRecipePlan(9300, {
    recipesByResult: makeMap([
      [9300, [{
        id: 1,
        resultItemId: 9300,
        resultQuantity: 1,
        ingredients: [{ itemId: 9301, quantity: 1 }, { itemId: 9302, quantity: 1 }],
        station: 'Workbench',
      }]],
      [9301, [{
        id: 2,
        resultItemId: 9301,
        resultQuantity: 1,
        ingredients: [{ itemId: 9303, quantity: 2 }],
        station: 'Furnace',
      }]],
      [9302, [{
        id: 3,
        resultItemId: 9302,
        resultQuantity: 1,
        ingredients: [{ itemId: 9303, quantity: 3 }],
        station: 'Anvil',
      }]],
    ]),
  })

  const leafEntry = plan.leafTotals.find((l) => l.itemId === 9303)
  assert.ok(leafEntry, '9303 should appear in leaf totals')
  assert.equal(leafEntry.quantity, 5) // 2 from 9301 branch + 3 from 9302 branch
})

// --- station count aggregation ---

test('planner: station counts accumulate across recipe chain', () => {
  // 9400 (Workbench) needs 9401 (Furnace) needs 9402 (base, no recipe)
  const plan = buildRecipePlan(9400, {
    recipesByResult: makeMap([
      [9400, [makeRecipe({ id: 1, resultItemId: 9400, station: 'Workbench', ingredients: [{ itemId: 9401, quantity: 1 }] })]],
      [9401, [makeRecipe({ id: 2, resultItemId: 9401, station: 'Furnace', ingredients: [{ itemId: 9402, quantity: 1 }] })]],
    ]),
  })

  const stationNames = plan.stations.map((s) => s.station)
  assert.ok(stationNames.includes('Workbench'), 'Workbench should be counted')
  assert.ok(stationNames.includes('Furnace'), 'Furnace should be counted')
})

// --- getItemName sorting ---

test('planner: getItemName callback causes leaf totals to sort alphabetically', () => {
  // Two base materials: id 9501 (name "Zinc") and id 9502 (name "Aether")
  const nameMap = new Map([[9501, 'Zinc'], [9502, 'Aether']])

  const plan = buildRecipePlan(9500, {
    recipesByResult: makeMap([
      [9500, [{
        id: 1,
        resultItemId: 9500,
        resultQuantity: 1,
        ingredients: [{ itemId: 9501, quantity: 1 }, { itemId: 9502, quantity: 1 }],
        station: 'Workbench',
      }]],
    ]),
    getItemName: (id) => nameMap.get(id),
  })

  assert.equal(plan.leafTotals[0].itemId, 9502) // Aether first
  assert.equal(plan.leafTotals[1].itemId, 9501) // Zinc second
})

// --- first-recipe strategy ---

test('planner: first-recipe strategy always picks the first recipe regardless of step count', () => {
  // Recipe 1 (id: 101) has more steps, recipe 2 (id: 102) has fewer steps
  // first-recipe should pick recipe 1 regardless
  const targetId = 9600
  const plan = buildRecipePlan(targetId, {
    strategy: 'first-recipe',
    recipesByResult: makeMap([
      [targetId, [
        makeRecipe({ id: 101, resultItemId: targetId, ingredients: [{ itemId: 9601, quantity: 1 }], station: 'Workbench' }),
        makeRecipe({ id: 102, resultItemId: targetId, ingredients: [{ itemId: 9602, quantity: 1 }], station: 'Anvil' }),
      ]],
      [9601, [makeRecipe({ id: 103, resultItemId: 9601, ingredients: [{ itemId: 9603, quantity: 1 }], station: 'Furnace' })]],
      // 9602 has no recipe (base material)
    ]),
  })

  assert.equal(plan.root.recipe?.id, 101)
})
