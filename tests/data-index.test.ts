import test from 'node:test'
import assert from 'node:assert/strict'
import { items, recipes, itemsById, prefixesById, prefixes, recipesByResult, recipesByIngredient } from '../src/data/index.ts'

test('data-index: items array is non-empty', () => {
  assert.ok(items.length > 0, 'items should be populated')
})

test('data-index: itemsById has one entry per item (no drops or duplicates)', () => {
  assert.equal(itemsById.size, items.length)
})

test('data-index: itemsById lookup matches original item by id', () => {
  const first = items[0]
  assert.ok(first, 'at least one item must exist')
  const found = itemsById.get(first.id)
  assert.deepEqual(found, first)
})

test('data-index: every item id is unique', () => {
  const ids = items.map((i) => i.id)
  const unique = new Set(ids)
  assert.equal(unique.size, ids.length, 'duplicate item ids detected')
})

test('data-index: prefixesById has one entry per prefix', () => {
  assert.equal(prefixesById.size, prefixes.length)
})

test('data-index: recipesByResult is non-empty', () => {
  assert.ok(recipesByResult.size > 0, 'recipesByResult should be populated')
})

test('data-index: every recipesByResult key matches recipe resultItemId', () => {
  for (const [key, bucket] of recipesByResult) {
    for (const recipe of bucket) {
      assert.equal(recipe.resultItemId, key, `recipe ${recipe.id} stored under wrong key ${key}`)
    }
  }
})

test('data-index: recipesByIngredient is non-empty', () => {
  assert.ok(recipesByIngredient.size > 0, 'recipesByIngredient should be populated')
})

test('data-index: every recipesByIngredient key appears in at least one recipe ingredient', () => {
  for (const [key, bucket] of recipesByIngredient) {
    for (const recipe of bucket) {
      const hasIngredient = recipe.ingredients.some((ing) => ing.itemId === key)
      assert.ok(hasIngredient, `recipe ${recipe.id} stored under ingredient key ${key} but does not reference it`)
    }
  }
})

test('data-index: a recipe reachable via recipesByResult is also in recipesByIngredient for each ingredient', () => {
  // Spot-check: take the first recipe that has ingredients and verify cross-indexing
  const firstWithIngredients = recipes.find((r) => r.ingredients.length > 0)
  assert.ok(firstWithIngredients, 'at least one recipe with ingredients must exist')

  for (const ing of firstWithIngredients.ingredients) {
    const bucket = recipesByIngredient.get(ing.itemId) ?? []
    const found = bucket.some((r) => r.id === firstWithIngredients.id)
    assert.ok(found, `recipe ${firstWithIngredients.id} not found in recipesByIngredient for ingredient ${ing.itemId}`)
  }
})

test('data-index: total recipes indexed by result equals recipes array length', () => {
  const totalIndexed = Array.from(recipesByResult.values()).reduce((sum, bucket) => sum + bucket.length, 0)
  assert.equal(totalIndexed, recipes.length)
})
