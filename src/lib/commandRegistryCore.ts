export type CommandGroup = 'Navigate' | 'Actions' | 'Presets' | 'Items'

export interface PaletteCommand {
  id: string
  label: string
  keywords: string
  group: CommandGroup
  priority: number
  run: () => void
}

export interface CommandRegistryItem {
  id: number
  name: string
  type: string
  progressionTier?: string
}

interface CreateCommandRegistryCoreOptions {
  navigate: (to: string) => void
  pathname: string
  items: CommandRegistryItem[]
  setHighContrastPreference: (enabled: boolean) => void
  setReducedMotionPreference: (enabled: boolean) => void
}

function getPriorityBoost(pathname: string, routePrefix: string): number {
  if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
    return 30
  }

  return 0
}

function itemRoute(itemId: number): string {
  return `/items/${itemId}`
}

export function createCommandRegistryCore({
  navigate,
  pathname,
  items,
  setHighContrastPreference,
  setReducedMotionPreference,
}: CreateCommandRegistryCoreOptions): PaletteCommand[] {
  const routeCommands: PaletteCommand[] = [
    { id: 'go-home', label: 'Go to Home', keywords: 'home dashboard start', group: 'Navigate', priority: 70 + getPriorityBoost(pathname, '/'), run: () => navigate('/') },
    { id: 'go-items', label: 'Go to Items', keywords: 'items lookup search', group: 'Navigate', priority: 80 + getPriorityBoost(pathname, '/items'), run: () => navigate('/items') },
    { id: 'go-sources', label: 'Go to Sources', keywords: 'item source explorer', group: 'Navigate', priority: 65 + getPriorityBoost(pathname, '/sources'), run: () => navigate('/sources') },
    { id: 'go-bosses', label: 'Go to Bosses', keywords: 'boss tracker progression', group: 'Navigate', priority: 85 + getPriorityBoost(pathname, '/bosses'), run: () => navigate('/bosses') },
    { id: 'go-prep', label: 'Go to Prep Guide', keywords: 'prep guide readiness', group: 'Navigate', priority: 70 + getPriorityBoost(pathname, '/prep'), run: () => navigate('/prep') },
    { id: 'go-builds', label: 'Go to Builds', keywords: 'recommended builds progression', group: 'Navigate', priority: 80 + getPriorityBoost(pathname, '/build'), run: () => navigate('/build') },
    { id: 'go-loadouts', label: 'Go to Loadouts', keywords: 'loadout builder compare', group: 'Navigate', priority: 80 + getPriorityBoost(pathname, '/loadouts'), run: () => navigate('/loadouts') },
    { id: 'go-biomes', label: 'Go to Biomes', keywords: 'biome guide', group: 'Navigate', priority: 65 + getPriorityBoost(pathname, '/biomes'), run: () => navigate('/biomes') },
    { id: 'go-npcs', label: 'Go to NPCs', keywords: 'npc guide happiness', group: 'Navigate', priority: 65 + getPriorityBoost(pathname, '/npcs'), run: () => navigate('/npcs') },
  ]

  const actionCommands: PaletteCommand[] = [
    {
      id: 'toggle-contrast-on',
      label: 'Enable High Contrast',
      keywords: 'contrast accessibility readability',
      group: 'Actions',
      priority: 60,
      run: () => setHighContrastPreference(true),
    },
    {
      id: 'toggle-contrast-off',
      label: 'Disable High Contrast',
      keywords: 'contrast accessibility readability',
      group: 'Actions',
      priority: 55,
      run: () => setHighContrastPreference(false),
    },
    {
      id: 'toggle-motion-on',
      label: 'Enable Reduced Motion',
      keywords: 'motion accessibility animation',
      group: 'Actions',
      priority: 60,
      run: () => setReducedMotionPreference(true),
    },
    {
      id: 'toggle-motion-off',
      label: 'Disable Reduced Motion',
      keywords: 'motion accessibility animation',
      group: 'Actions',
      priority: 55,
      run: () => setReducedMotionPreference(false),
    },
  ]

  const presetCommands: PaletteCommand[] = [
    {
      id: 'preset-items-wishlist',
      label: 'Preset: Item Wishlist Drops',
      keywords: 'items preset wishlist drops farm',
      group: 'Presets',
      priority: 75,
      run: () => navigate('/items?loot=wishlist'),
    },
    {
      id: 'preset-items-acquired',
      label: 'Preset: Item Acquired Drops',
      keywords: 'items preset acquired drops',
      group: 'Presets',
      priority: 70,
      run: () => navigate('/items?loot=acquired'),
    },
    {
      id: 'preset-bosses-missing',
      label: 'Preset: Bosses Missing Drops',
      keywords: 'bosses preset missing drops',
      group: 'Presets',
      priority: 80,
      run: () => navigate('/bosses?drops=missing'),
    },
    {
      id: 'preset-builds-early-melee',
      label: 'Preset: Builds Early Melee',
      keywords: 'build preset early melee',
      group: 'Presets',
      priority: 65,
      run: () => navigate('/build?class=melee&cap=Early%20Game&stage=Early%20Game'),
    },
    {
      id: 'preset-builds-endgame-summoner',
      label: 'Preset: Builds Endgame Summoner',
      keywords: 'build preset endgame summoner',
      group: 'Presets',
      priority: 65,
      run: () => navigate('/build?class=summoner&cap=Endgame&stage=Endgame'),
    },
  ]

  const itemCommands: PaletteCommand[] = items.map((item) => ({
    id: `item-${item.id}`,
    label: `Item: ${item.name}`,
    keywords: `${item.name} ${item.type} ${item.progressionTier ?? ''}`,
    group: 'Items',
    priority: pathname.startsWith('/items') ? 45 : 30,
    run: () => navigate(itemRoute(item.id)),
  }))

  return [...routeCommands, ...actionCommands, ...presetCommands, ...itemCommands]
}
