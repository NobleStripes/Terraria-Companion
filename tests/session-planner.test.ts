import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSessionPlan, computeRecommendedStageFromBosses } from '../src/lib/sessionPlannerCore.ts'
import type { Boss } from '../src/types/boss.ts'
import type { Item } from '../src/types/item.ts'
import type { Npc } from '../src/types/npc.ts'
import type { Biome } from '../src/types/biome.ts'

const bossTemplate: Omit<Boss, 'id' | 'name' | 'order'> = {
  phase: 'pre-hardmode',
  summonItem: undefined,
  summonCondition: undefined,
  drops: [],
  recommendedGear: [
    {
      class: 'melee',
      armor: [],
      weapons: [],
      accessories: [],
    },
  ],
  strategy: 'placeholder',
  tips: [],
}

const bosses: Boss[] = [
  { ...bossTemplate, id: 'king-slime', name: 'King Slime', order: 1 },
  { ...bossTemplate, id: 'eye-of-cthulhu', name: 'Eye of Cthulhu', order: 2 },
]

const npcs: Npc[] = [
  {
    id: 'merchant',
    name: 'Merchant',
    description: '',
    unlockCondition: 'Have 50 silver coins',
    sells: [],
    happiness: {
      lovedBiomes: [],
      likedBiomes: [],
      dislikedBiomes: [],
      hatedBiomes: [],
      lovedNeighbors: [],
      likedNeighbors: [],
      dislikedNeighbors: [],
      hatedNeighbors: [],
    },
    housingRequirements: 'Standard housing',
  },
]

const biomes: Biome[] = [
  {
    id: 'forest',
    name: 'Forest',
    description: '',
    layer: 'surface',
    hardmodeOnly: false,
    resources: [],
    commonEnemies: [],
    uniqueFeatures: [],
    happyNpcs: [],
  },
]

const items: Item[] = [
  {
    id: 1,
    name: 'Iron Sword',
    type: 'weapon',
    rarity: 'white',
    tooltip: '',
    sources: ['Purchased from the Merchant', 'Forest biome loot chest'],
    npcDrops: ['Merchant'],
    progressionTier: 'early-game',
    damage: 1,
    knockback: 1,
    useTime: 1,
  },
  {
    id: 2,
    name: 'Leather Boots',
    type: 'accessory',
    rarity: 'white',
    tooltip: '',
    sources: ['Forest biome surface chest'],
    progressionTier: 'early-game',
  },
]

test('computeRecommendedStageFromBosses follows progression thresholds', () => {
  assert.equal(computeRecommendedStageFromBosses(0), 'Early Game')
  assert.equal(computeRecommendedStageFromBosses(3), 'Pre-Hardmode')
  assert.equal(computeRecommendedStageFromBosses(8), 'Early Hardmode')
  assert.equal(computeRecommendedStageFromBosses(20), 'Endgame')
})

test('buildSessionPlan prioritizes next undefeated boss', () => {
  const plan = buildSessionPlan({
    bosses,
    defeatedBossIds: new Set(['king-slime']),
    prepCompletionByBossId: {
      'king-slime': { completed: 4, total: 4 },
      'eye-of-cthulhu': { completed: 2, total: 4 },
    },
    activeBuildClass: 'melee',
    currentStage: 'Early Game',
    stageArmor: 'Iron Armor',
    stageWeapon: 'Iron Sword',
    stageAccessories: ['Leather Boots'],
    equippedItemNames: ['Iron Sword'],
    wishedDrops: [],
    items,
    npcs,
    biomes,
  })

  assert.equal(plan.goals[0]?.kind, 'boss')
  assert.match(plan.goals[0]?.title ?? '', /Eye of Cthulhu/)
})

test('buildSessionPlan includes npc and biome goals when matching missing items', () => {
  const plan = buildSessionPlan({
    bosses,
    defeatedBossIds: new Set(),
    prepCompletionByBossId: {
      'king-slime': { completed: 0, total: 4 },
      'eye-of-cthulhu': { completed: 0, total: 4 },
    },
    activeBuildClass: 'melee',
    currentStage: 'Early Game',
    stageArmor: 'Iron Armor',
    stageWeapon: 'Iron Sword',
    stageAccessories: ['Leather Boots'],
    equippedItemNames: [],
    wishedDrops: ['Some Drop'],
    items,
    npcs,
    biomes,
  })

  assert.ok(plan.goals.some((goal) => goal.kind === 'npc'))
  assert.ok(plan.goals.some((goal) => goal.kind === 'biome'))
  assert.ok(plan.summary.missingBuildItems >= 2)
})

test('buildSessionPlan deduplicates repeated recommended item names', () => {
  const plan = buildSessionPlan({
    bosses,
    defeatedBossIds: new Set(),
    prepCompletionByBossId: {
      'king-slime': { completed: 0, total: 4 },
      'eye-of-cthulhu': { completed: 0, total: 4 },
    },
    activeBuildClass: 'melee',
    currentStage: 'Early Game',
    stageArmor: 'Iron Sword',
    stageWeapon: 'Iron Sword',
    stageAccessories: ['Iron Sword', 'Leather Boots'],
    equippedItemNames: [],
    wishedDrops: [],
    items,
    npcs,
    biomes,
  })

  assert.equal(plan.summary.missingBuildItems, 2)
})

test('buildSessionPlan skips boss goal when all bosses are defeated', () => {
  const plan = buildSessionPlan({
    bosses,
    defeatedBossIds: new Set(['king-slime', 'eye-of-cthulhu']),
    prepCompletionByBossId: {
      'king-slime': { completed: 4, total: 4 },
      'eye-of-cthulhu': { completed: 4, total: 4 },
    },
    activeBuildClass: 'melee',
    currentStage: 'Early Game',
    stageArmor: 'Iron Armor',
    stageWeapon: 'Iron Sword',
    stageAccessories: ['Leather Boots'],
    equippedItemNames: ['Iron Sword'],
    wishedDrops: [],
    items,
    npcs,
    biomes,
  })

  assert.ok(plan.goals.every((goal) => goal.kind !== 'boss'))
})
