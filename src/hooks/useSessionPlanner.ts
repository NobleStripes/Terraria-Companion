import { useMemo } from 'react'
import { getFilteredStageBuilds } from '@/data/builds'
import { biomes, bosses, items, npcs, itemsById } from '@/data/index'
import { useBosses } from '@/hooks/useBosses'
import { buildSessionPlan, computeRecommendedStageFromBosses } from '@/lib/sessionPlannerCore'
import { normalizeItemName as normalize } from '@/lib/normalize'
import { useBuildStore } from '@/store/buildStore'
import type { BuildClass } from '@/types/boss'
import type { SessionPlan } from '@/types/session-plan'

const itemNameByNormalizedName = new Map(items.map((item) => [normalize(item.name), item.name]))

function resolveEquippedItemNames(itemIds: Array<number | undefined>): string[] {
  return itemIds
    .map((itemId) => (typeof itemId === 'number' ? itemsById.get(itemId)?.name : undefined))
    .filter((itemName): itemName is string => Boolean(itemName))
}

export function useSessionPlanner(): SessionPlan {
  const { allBosses, defeatedCount, isDefeated, getPrepCompletion, getTrackedDropNames } = useBosses()
  const loadouts = useBuildStore((state) => state.loadouts)
  const activeLoadoutId = useBuildStore((state) => state.activeLoadoutId)

  return useMemo(() => {
    const activeLoadout = loadouts.find((loadout) => loadout.id === activeLoadoutId) ?? loadouts[0]
    const activeBuildClass: BuildClass = activeLoadout?.class ?? 'melee'

    const defeatedBossIds = new Set(allBosses.filter((boss) => isDefeated(boss.id)).map((boss) => boss.id))

    const prepCompletionByBossId = Object.fromEntries(
      bosses.map((boss) => [boss.id, getPrepCompletion(boss.id)])
    )

    const currentStage = computeRecommendedStageFromBosses(defeatedCount)
    const stageRecommendations = getFilteredStageBuilds(activeBuildClass, {
      worldEvil: 'corruption',
      difficulty: 'classic',
      progressionCap: currentStage,
    })

    const currentRecommendation = stageRecommendations.at(-1)
    const stageArmor = currentRecommendation?.armor ?? 'No armor recommendation'
    const stageWeapon = currentRecommendation?.weapon ?? 'No weapon recommendation'
    const stageAccessories = currentRecommendation?.accessories ?? []

    const equippedItemNames = activeLoadout
      ? resolveEquippedItemNames([
          activeLoadout.slots.weapon,
          ...activeLoadout.slots.armor,
          ...activeLoadout.slots.accessories,
        ])
      : []

    const wishedDrops = getTrackedDropNames('wished')

    const normalizedWishedDrops = wishedDrops
      .map((dropName) => itemNameByNormalizedName.get(normalize(dropName)) ?? dropName)
      .filter(Boolean)

    return buildSessionPlan({
      bosses,
      defeatedBossIds,
      prepCompletionByBossId,
      activeBuildClass,
      currentStage,
      stageArmor,
      stageWeapon,
      stageAccessories,
      equippedItemNames,
      wishedDrops: normalizedWishedDrops,
      items,
      npcs,
      biomes,
    })
  }, [activeLoadoutId, allBosses, defeatedCount, getPrepCompletion, getTrackedDropNames, isDefeated, loadouts])
}
