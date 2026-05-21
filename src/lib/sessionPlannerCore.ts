import type { StageName } from '@/types/build'
import type { SessionGoal, SessionPlannerInput, SessionPlan } from '@/types/session-plan'

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function stageFromBossProgress(defeatedCount: number): StageName {
  if (defeatedCount < 3) {
    return 'Early Game'
  }

  if (defeatedCount < 7) {
    return 'Pre-Hardmode'
  }

  if (defeatedCount < 13) {
    return 'Early Hardmode'
  }

  return 'Endgame'
}

function matchBiomeFromSource(source: string, biomeNames: string[]): string | null {
  const lowerSource = source.toLowerCase()

  for (const biomeName of biomeNames) {
    if (lowerSource.includes(biomeName.toLowerCase())) {
      return biomeName
    }
  }

  return null
}

export function computeRecommendedStageFromBosses(defeatedCount: number): StageName {
  return stageFromBossProgress(defeatedCount)
}

export function buildSessionPlan(input: SessionPlannerInput): SessionPlan {
  const goals: SessionGoal[] = []
  const sortedBosses = [...input.bosses].sort((a, b) => a.order - b.order)
  const defeatedBosses = sortedBosses.filter((boss) => input.defeatedBossIds.has(boss.id))
  const nextBoss = sortedBosses.find((boss) => !input.defeatedBossIds.has(boss.id))

  const equippedNames = new Set(input.equippedItemNames.map(normalize))
  const recommendedBuildItems = [input.stageArmor, input.stageWeapon, ...input.stageAccessories].filter(Boolean)
  const recommendedByNormalizedName = new Map(recommendedBuildItems.map((itemName) => [normalize(itemName), itemName]))
  const uniqueRecommendedBuildItems = [...recommendedByNormalizedName.values()]
  const missingBuildItems = uniqueRecommendedBuildItems.filter((name) => !equippedNames.has(normalize(name)))

  const itemByNormalizedName = new Map(input.items.map((item) => [normalize(item.name), item]))
  const missingItemRecords = missingBuildItems
    .map((itemName) => itemByNormalizedName.get(normalize(itemName)))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  if (nextBoss) {
    const prep = input.prepCompletionByBossId[nextBoss.id] ?? { completed: 0, total: 4 }
    const prepRatio = prep.total > 0 ? prep.completed / prep.total : 0
    const prepReadyBonus = prep.total > 0 && prep.completed === prep.total ? 8 : 0

    goals.push({
      id: `boss-${nextBoss.id}`,
      kind: 'boss',
      title: `Prepare for ${nextBoss.name}`,
      reason: `${prep.completed}/${prep.total} prep checks complete. Focus this boss to unlock next progression step.`,
      score: 68 + prepRatio * 24 + prepReadyBonus,
      route: `/bosses/${nextBoss.id}`,
    })
  }

  goals.push({
    id: `build-${input.activeBuildClass}-${input.currentStage}`,
    kind: 'build',
    title: `Advance ${input.activeBuildClass} build (${input.currentStage})`,
    reason:
      missingBuildItems.length > 0
        ? `${missingBuildItems.length} recommended gear pieces are still missing from your active loadout.`
        : 'Current stage recommendation is already represented in your active loadout.',
    score: 50 + Math.min(missingBuildItems.length * 3, 24) + (missingBuildItems.length >= 3 ? 6 : 0),
    route: `/build?class=${input.activeBuildClass}&cap=${encodeURIComponent(input.currentStage)}&stage=${encodeURIComponent(input.currentStage)}`,
  })

  if (input.wishedDrops.length > 0) {
    goals.push({
      id: 'wishlist-drops',
      kind: 'wishlist',
      title: `Farm wishlist drops (${input.wishedDrops.length})`,
      reason: `${input.wishedDrops.slice(0, 3).join(', ')}${input.wishedDrops.length > 3 ? '…' : ''}`,
      score: 42 + Math.min(input.wishedDrops.length * 2, 16),
      route: '/bosses',
    })
  }

  const npcCounts = new Map<string, number>()
  for (const item of missingItemRecords) {
    for (const npcName of item.npcDrops ?? []) {
      npcCounts.set(npcName, (npcCounts.get(npcName) ?? 0) + 1)
    }
  }

  const topNpc = [...npcCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  if (topNpc) {
    const [npcName, npcHits] = topNpc
    const npc = input.npcs.find((candidate) => candidate.name.toLowerCase() === npcName.toLowerCase())

    goals.push({
      id: `npc-${npcName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      kind: 'npc',
      title: `Visit ${npcName}`,
      reason: npc
        ? `${npcHits} missing gear items point to this NPC. Unlock: ${npc.unlockCondition}.`
        : `${npcHits} missing gear items point to this NPC vendor.`,
      score: 40 + npcHits * 3,
      route: '/npcs',
    })
  }

  const biomeNames = input.biomes.map((biome) => biome.name)
  const biomeCounts = new Map<string, number>()

  for (const item of missingItemRecords) {
    for (const source of item.sources) {
      const matchedBiome = matchBiomeFromSource(source, biomeNames)
      if (!matchedBiome) {
        continue
      }

      biomeCounts.set(matchedBiome, (biomeCounts.get(matchedBiome) ?? 0) + 1)
    }
  }

  const topBiome = [...biomeCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]
  if (topBiome) {
    const [biomeName, biomeHits] = topBiome

    goals.push({
      id: `biome-${biomeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      kind: 'biome',
      title: `Explore ${biomeName}`,
      reason: `${biomeHits} missing recommended items reference this biome in their source notes.`,
      score: 36 + biomeHits * 2,
      route: '/biomes',
    })
  }

  goals.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))

  const headline = goals[0]?.title ?? 'Keep progressing your session goals'

  const prepReadyBosses = sortedBosses.filter((boss) => {
    const prep = input.prepCompletionByBossId[boss.id] ?? { completed: 0, total: 4 }
    return prep.total > 0 && prep.completed === prep.total
  }).length

  return {
    generatedAt: new Date().toISOString(),
    headline,
    goals,
    summary: {
      defeatedBosses: defeatedBosses.length,
      totalBosses: sortedBosses.length,
      prepReadyBosses,
      missingBuildItems: missingBuildItems.length,
      wishedDrops: input.wishedDrops.length,
    },
  }
}
