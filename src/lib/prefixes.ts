import type { Item } from '@/types/item'
import type { Prefix, PrefixModifiers } from '@/types/prefix'

export interface PrefixedItemStats {
  damage?: number
  defense?: number
  knockback?: number
  critChance?: number
  useTime?: number
  manaCost?: number
}

function applyPct(value: number, pct: number): number {
  return Math.round((value * (100 + pct)) / 100)
}

function applyUseSpeed(baseUseTime: number, useSpeedPct: number): number {
  // Higher use speed means lower use time in Terraria terms.
  const next = Math.round((baseUseTime * 100) / (100 + useSpeedPct))
  return Math.max(1, next)
}

function getWeaponCategories(item: Item): Array<NonNullable<Prefix['weaponCategories']>[number]> {
  if (item.type === 'tool') {
    return ['tool', 'melee-swing']
  }

  if (item.type !== 'weapon') {
    return []
  }

  const lowerName = item.name.toLowerCase()

  if (/(yoyo|boomerang|flail|spear|javelin|bananarang|disc)/.test(lowerName)) {
    return []
  }

  if (lowerName === 'terrarian') {
    return []
  }

  if (/whip/.test(lowerName)) {
    return ['melee-swing']
  }

  if ((item.critChance ?? 0) === 0 && (item.manaCost ?? 0) > 0) {
    return ['summon']
  }

  if ((item.manaCost ?? 0) > 0) {
    return ['magic']
  }

  if (/(bow|gun|rifle|launcher|repeater|shotbow|musket|pistol|sniper|uzi|blaster|cannon|dart|stormbow)/.test(lowerName)) {
    return ['ranged']
  }

  return ['melee-swing']
}

export function canApplyPrefix(item: Item, prefix: Prefix): boolean {
  if (!prefix.appliesTo.includes(item.type as Prefix['appliesTo'][number])) {
    return false
  }

  if (!prefix.weaponCategories?.length) {
    return true
  }

  const categories = getWeaponCategories(item)
  return prefix.weaponCategories.some((category) => categories.includes(category))
}

export function applyPrefixToItemStats(item: Item, prefix: Prefix): PrefixedItemStats {
  if (!canApplyPrefix(item, prefix)) return {}

  const mods: PrefixModifiers = prefix.modifiers
  const result: PrefixedItemStats = {}

  if (item.damage !== undefined) {
    result.damage = mods.damagePct !== undefined ? applyPct(item.damage, mods.damagePct) : item.damage
  }

  if (item.defense !== undefined) {
    result.defense = mods.defense !== undefined ? item.defense + mods.defense : item.defense
  }

  if (item.knockback !== undefined) {
    result.knockback = mods.knockbackPct !== undefined
      ? Number(((item.knockback * (100 + mods.knockbackPct)) / 100).toFixed(2))
      : item.knockback
  }

  if (item.critChance !== undefined) {
    result.critChance = mods.critChance !== undefined ? item.critChance + mods.critChance : item.critChance
  }

  if (item.useTime !== undefined) {
    result.useTime = mods.useSpeedPct !== undefined
      ? applyUseSpeed(item.useTime, mods.useSpeedPct)
      : item.useTime
  }

  if (item.manaCost !== undefined) {
    result.manaCost = mods.manaCostPct !== undefined ? applyPct(item.manaCost, mods.manaCostPct) : item.manaCost
  }

  return result
}
