/**
 * Terraria Companion Data Library
 * Export game data (items, bosses, NPCs, biomes) for use in other applications
 */

export { items } from './src/data/items.json';
export { bosses } from './src/data/bosses.json';
export { npcs } from './src/data/npcs.json';
export { biomes } from './src/data/biomes.json';
export { recipes } from './src/data/recipes.json';

// Export types
export type { Item } from './src/types/item';
export type { Boss } from './src/types/boss';
export type { NPC } from './src/types/npc';
export type { Biome } from './src/types/biome';
export type { Recipe } from './src/types/recipe';

// Export utility functions
export { useItemSearch } from './src/hooks/useItemSearch';
export { useBosses } from './src/hooks/useBosses';
export { useRecipes } from './src/hooks/useRecipes';
export { searchItems } from './src/lib/search';
