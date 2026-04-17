import { bosses } from '@/data/index'
import { useBossStore } from '@/store/bossStore'
import type { GamePhase } from '@/types/boss'

export function useBosses() {
  const { defeatedBosses, toggleBoss, resetAll, isDefeated } = useBossStore()

  const grouped: Record<GamePhase, typeof bosses> = {
    'pre-hardmode': [],
    hardmode: [],
    'post-moonlord': [],
  }

  for (const boss of bosses) {
    grouped[boss.phase].push(boss)
  }

  for (const phase of Object.keys(grouped) as GamePhase[]) {
    grouped[phase].sort((a, b) => a.order - b.order)
  }

  return {
    grouped,
    allBosses: bosses,
    totalCount: bosses.length,
    defeatedCount: defeatedBosses.length,
    toggleBoss,
    resetAll,
    isDefeated,
  }
}
