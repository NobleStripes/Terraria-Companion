import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ExternalLink, Filter, Package, Plus, Scale, X } from 'lucide-react'
import { SearchBar } from '@/components/ui/SearchBar'
import { ItemCard } from '@/components/ui/ItemCard'
import { RecipeCard } from '@/components/ui/RecipeCard'
import { RarityBadge, TypeBadge } from '@/components/ui/Badge'
import { useItemSearch } from '@/hooks/useItemSearch'
import { useViewport } from '@/hooks/useViewport'
import { useRecipesForItem } from '@/hooks/useRecipes'
import { usePrefixesForItem } from '@/hooks/usePrefixes'
import { itemsById, items, prefixesById } from '@/data/index'
import type { Item } from '@/types/item'
import { applyPrefixToItemStats } from '@/lib/prefixes'
import { useBuildStore } from '@/store/buildStore'

const RECENT_COUNT = 20
const MAX_COMPARE_ITEMS = 3

type ItemClassFilter = 'all' | 'melee' | 'ranged' | 'magic' | 'summoner' | 'utility'
type DamageFilter = 'all' | 'has-damage' | 'non-damage'
type SourceFilter = 'all' | 'crafted' | 'drop' | 'vendor' | 'event' | 'exploration'
type TierFilter = 'all' | 'early-game' | 'pre-hardmode' | 'early-hardmode' | 'endgame'
type LoadoutSlotTarget =
  | 'weapon'
  | 'armor-head'
  | 'armor-body'
  | 'armor-legs'
  | 'accessory-0'
  | 'accessory-1'
  | 'accessory-2'
  | 'accessory-3'
  | 'accessory-4'

const headArmorPattern = /(helmet|mask|hood|hat|wig|cap|head|brow)/i
const bodyArmorPattern = /(breastplate|chestplate|plate|mail|shirt|robe|jerkin|cuirass|dress|plating|tunic|vest)/i
const legArmorPattern = /(greaves|leggings|pants|trousers|legguards|legging)/i

function getEligibleLoadoutTargets(item: Item): Array<{ value: LoadoutSlotTarget; label: string }> {
  if (item.type === 'weapon') {
    return [{ value: 'weapon', label: 'Weapon slot' }]
  }

  if (item.type === 'accessory') {
    return Array.from({ length: 5 }, (_, index) => ({
      value: `accessory-${index}` as LoadoutSlotTarget,
      label: `Accessory slot ${index + 1}`,
    }))
  }

  if (item.type === 'armor') {
    if (headArmorPattern.test(item.name)) {
      return [{ value: 'armor-head', label: 'Head armor' }]
    }

    if (bodyArmorPattern.test(item.name)) {
      return [{ value: 'armor-body', label: 'Body armor' }]
    }

    if (legArmorPattern.test(item.name)) {
      return [{ value: 'armor-legs', label: 'Leg armor' }]
    }
  }

  return []
}

function getItemClassBucket(item: Item): Exclude<ItemClassFilter, 'all'> {
  const lower = item.name.toLowerCase()

  if (item.type === 'material' || item.type === 'furniture' || item.type === 'consumable' || item.type === 'misc') {
    return 'utility'
  }

  if (item.type === 'accessory' || item.type === 'armor' || item.type === 'tool') {
    return 'utility'
  }

  if ((item.manaCost ?? 0) > 0 && (item.critChance ?? 0) === 0) {
    if (lower.includes('staff') || lower.includes('whip') || lower.includes('summon')) {
      return 'summoner'
    }
    return 'magic'
  }

  if ((item.manaCost ?? 0) > 0) {
    return 'magic'
  }

  if (/(bow|gun|rifle|launcher|arrow|bullet|dart|stormbow|quiver|cannon)/.test(lower)) {
    return 'ranged'
  }

  if (/(whip|staff|sanguine|spider|imp)/.test(lower) && (item.critChance ?? 0) === 0) {
    return 'summoner'
  }

  return 'melee'
}

function getSourceType(item: Item): Exclude<SourceFilter, 'all'> {
  const sourceText = item.sources.join(' ').toLowerCase()

  if (/(craft|anvil|work bench|station)/.test(sourceText)) return 'crafted'
  if (/(merchant|npc|sold by|vendor|traveling)/.test(sourceText)) return 'vendor'
  if (/(event|invasion|moon|pumpkin|frost)/.test(sourceText)) return 'event'
  if (/(drop|boss|enemy|found in|obtained from)/.test(sourceText)) return 'drop'
  return 'exploration'
}

function compareStat(a?: number, b?: number) {
  if (a === undefined || b === undefined) return ''
  if (a === b) return 'tie'
  return a > b ? 'win' : 'lose'
}

function ItemDetailPanel({
  item,
  onItemClick,
  selectedPrefixId,
  onPrefixChange,
  onCompareToggle,
  compareSelected,
  activeLoadoutName,
  onAssignToLoadout,
}: {
  item: Item
  onItemClick: (itemId: number) => void
  selectedPrefixId: string
  onPrefixChange: (prefixId: string) => void
  onCompareToggle: (itemId: number) => void
  compareSelected: boolean
  activeLoadoutName: string | null
  onAssignToLoadout: (item: Item, target: LoadoutSlotTarget) => void
}) {
  const { crafts, usedIn } = useRecipesForItem(item.id)
  const availablePrefixes = usePrefixesForItem(item)
  const eligibleLoadoutTargets = useMemo(() => getEligibleLoadoutTargets(item), [item])
  const [selectedLoadoutTarget, setSelectedLoadoutTarget] = useState<LoadoutSlotTarget | ''>(
    eligibleLoadoutTargets[0]?.value ?? ''
  )
  const [assignmentMessage, setAssignmentMessage] = useState('')

  const selectedPrefix = useMemo(
    () => availablePrefixes.find((prefix) => prefix.id === selectedPrefixId),
    [availablePrefixes, selectedPrefixId]
  )

  const stats = useMemo(() => {
    const base = {
      damage: item.damage,
      defense: item.defense,
      knockback: item.knockback,
      critChance: item.critChance,
      useTime: item.useTime,
      manaCost: item.manaCost,
      pickaxePower: item.pickaxePower,
      axePower: item.axePower,
      hammerPower: item.hammerPower,
    }

    const prefixed = selectedPrefix ? applyPrefixToItemStats(item, selectedPrefix) : base

    return [
      { key: 'damage', label: 'Damage', base: base.damage, next: prefixed.damage },
      { key: 'defense', label: 'Defense', base: base.defense, next: prefixed.defense },
      { key: 'knockback', label: 'Knockback', base: base.knockback, next: prefixed.knockback },
      { key: 'critChance', label: 'Crit Chance', base: base.critChance, next: prefixed.critChance, suffix: '%' },
      { key: 'useTime', label: 'Use Time', base: base.useTime, next: prefixed.useTime },
      { key: 'manaCost', label: 'Mana Cost', base: base.manaCost, next: prefixed.manaCost },
      { key: 'pickaxePower', label: 'Pickaxe Power', base: base.pickaxePower, next: base.pickaxePower, suffix: '%' },
      { key: 'axePower', label: 'Axe Power', base: base.axePower, next: base.axePower, suffix: '%' },
      { key: 'hammerPower', label: 'Hammer Power', base: base.hammerPower, next: base.hammerPower, suffix: '%' },
    ].filter((entry) => entry.base !== undefined)
  }, [item, selectedPrefix])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">
          {selectedPrefix ? `${selectedPrefix.name} ` : ''}
          {item.name}
        </h2>
        <div className="flex items-center gap-2 mb-3">
          <RarityBadge rarity={item.rarity} />
          <TypeBadge type={item.type} />
        </div>
        {availablePrefixes.length > 0 && (
          <div className="mb-3">
            <label className="block text-terra-gold text-xs font-pixel mb-1.5">Prefix</label>
            <select
              value={selectedPrefixId}
              onChange={(e) => onPrefixChange(e.target.value)}
              className="w-full bg-terra-bg border border-terra-border rounded-lg px-3 py-2 text-sm text-white focus:border-terra-gold focus:outline-none"
            >
              <option value="">None</option>
              {availablePrefixes.map((prefix) => (
                <option key={prefix.id} value={prefix.id}>
                  {prefix.name}
                </option>
              ))}
            </select>
            {selectedPrefix && (
              <p className="text-gray-400 text-xs mt-1">{selectedPrefix.tooltip}</p>
            )}
          </div>
        )}
        <p className="text-gray-300 text-sm italic leading-relaxed">{item.tooltip}</p>
        <button
          onClick={() => onCompareToggle(item.id)}
          className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded border border-terra-border text-xs text-gray-300 hover:text-terra-gold hover:border-terra-gold transition-colors"
        >
          <Scale className="w-3.5 h-3.5" />
          {compareSelected ? 'Remove from compare' : 'Add to compare'}
        </button>
        {eligibleLoadoutTargets.length > 0 && (
          <div className="mt-3 rounded-lg border border-terra-border bg-terra-bg p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-terra-gold text-xs font-pixel mb-1.5">Add To Active Loadout</label>
                <select
                  value={selectedLoadoutTarget}
                  onChange={(event) => setSelectedLoadoutTarget(event.target.value as LoadoutSlotTarget)}
                  className="w-full bg-terra-surface border border-terra-border rounded-lg px-3 py-2 text-sm text-white focus:border-terra-gold focus:outline-none"
                  disabled={!activeLoadoutName}
                >
                  {eligibleLoadoutTargets.map((target) => (
                    <option key={target.value} value={target.value}>
                      {target.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  if (!selectedLoadoutTarget) {
                    return
                  }

                  onAssignToLoadout(item, selectedLoadoutTarget)
                  const selectedTargetLabel = eligibleLoadoutTargets.find((target) => target.value === selectedLoadoutTarget)?.label ?? 'selected slot'
                  setAssignmentMessage(`Added ${item.name} to ${selectedTargetLabel.toLowerCase()} in ${activeLoadoutName ?? 'your active loadout'}.`)
                }}
                disabled={!activeLoadoutName || !selectedLoadoutTarget}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-terra-border px-3 py-2.5 min-h-11 text-xs text-gray-300 hover:text-terra-gold hover:border-terra-gold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
            {activeLoadoutName ? (
              <p className="mt-2 text-xs text-gray-400">
                Active loadout: <span className="text-white">{activeLoadoutName}</span>
              </p>
            ) : (
              <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                Create or select a loadout in <Link to="/loadouts" className="text-terra-sky hover:text-terra-gold transition-colors">Loadouts</Link> before assigning items from Item Lookup.
              </p>
            )}
            {assignmentMessage && (
              <p className="mt-2 text-xs text-terra-gold">{assignmentMessage}</p>
            )}
          </div>
        )}
      </div>

      {stats.length > 0 && (
        <div>
          <h3 className="text-terra-gold text-xs font-pixel mb-2">Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {stats.map((stat) => {
              const changed = stat.next !== stat.base
              const suffix = stat.suffix ?? ''
              return (
                <div key={stat.key} className="bg-terra-bg border border-terra-border rounded-lg px-3 py-2">
                  <div className="text-xs text-gray-400">{stat.label}</div>
                  <div className="text-sm text-white font-semibold">
                    {changed ? (
                      <>
                        <span className="text-gray-400">{stat.base}{suffix}</span>
                        <span className="mx-1 text-gray-500">→</span>
                        <span className={stat.next! > stat.base! ? 'text-green-400' : 'text-red-400'}>
                          {stat.next}{suffix}
                        </span>
                      </>
                    ) : (
                      <span>{stat.base}{suffix}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {item.sources.length > 0 && (
        <div>
          <h3 className="text-terra-gold text-xs font-pixel mb-2">Sources</h3>
          <ul className="space-y-1">
            {item.sources.map((source) => (
              <li key={source} className="text-gray-300 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-terra-gold rounded-full shrink-0" />
                {source}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.enemyDrops && item.enemyDrops.length > 0 && (
        <div>
          <h3 className="text-terra-gold text-xs font-pixel mb-2">Enemy Drops</h3>
          <ul className="space-y-1">
            {item.enemyDrops.map((drop) => (
              <li key={drop} className="text-gray-300 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-terra-red rounded-full shrink-0" />
                {drop}
              </li>
            ))}
          </ul>
        </div>
      )}

      {crafts.length > 0 && (
        <div>
          <h3 className="text-terra-gold text-xs font-pixel mb-2">
            Crafted With ({crafts.length})
          </h3>
          <div className="space-y-2">
            {crafts.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onItemClick={onItemClick} />
            ))}
          </div>
        </div>
      )}

      {usedIn.length > 0 && (
        <div>
          <h3 className="text-terra-gold text-xs font-pixel mb-2">
            Used In ({usedIn.length})
          </h3>
          <div className="space-y-2">
            {usedIn.map((recipe) => {
              const resultItem = itemsById.get(recipe.resultItemId)
              return (
                <div key={recipe.id} className="bg-terra-bg border border-terra-border rounded-lg p-3">
                  <button
                    onClick={() => onItemClick(recipe.resultItemId)}
                    className="text-sm font-semibold text-terra-sky hover:text-terra-gold transition-colors mb-1 text-left"
                  >
                    → {resultItem?.name ?? `Item #${recipe.resultItemId}`}
                    {recipe.resultQuantity > 1 ? ` ×${recipe.resultQuantity}` : ''}
                  </button>
                  <div className="text-xs text-gray-500">at {recipe.station}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {item.wikiSlug && (
        <a
          href={`https://terraria.wiki.gg/wiki/${item.wikiSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-terra-sky hover:text-terra-gold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View on Wiki
        </a>
      )}
    </div>
  )
}

export default function ItemLookup() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const { isMobile, isTablet } = useViewport()
  const [query, setQuery] = useState('')
  const selectedId = useMemo(() => {
    if (!itemId) return undefined
    const parsed = Number.parseInt(itemId, 10)
    return Number.isNaN(parsed) ? undefined : parsed
  }, [itemId])
  const [selectedPrefixId, setSelectedPrefixId] = useState('')
  const [classFilter, setClassFilter] = useState<ItemClassFilter>('all')
  const [damageFilter, setDamageFilter] = useState<DamageFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const loadouts = useBuildStore((state) => state.loadouts)
  const activeLoadoutId = useBuildStore((state) => state.activeLoadoutId)
  const setWeapon = useBuildStore((state) => state.setWeapon)
  const setArmorSlot = useBuildStore((state) => state.setArmorSlot)
  const setAccessorySlot = useBuildStore((state) => state.setAccessorySlot)

  const searchResults = useItemSearch(query)
  const queriedItems = query.trim().length >= 2
    ? searchResults.map((r) => r.item)
    : items.slice(0, RECENT_COUNT)

  const displayItems = useMemo(() => {
    return queriedItems.filter((item) => {
      if (classFilter !== 'all' && getItemClassBucket(item) !== classFilter) {
        return false
      }

      if (damageFilter === 'has-damage' && item.damage === undefined) {
        return false
      }

      if (damageFilter === 'non-damage' && item.damage !== undefined) {
        return false
      }

      if (sourceFilter !== 'all' && getSourceType(item) !== sourceFilter) {
        return false
      }

      if (tierFilter !== 'all' && item.progressionTier !== tierFilter) {
        return false
      }

      return true
    })
  }, [queriedItems, classFilter, damageFilter, sourceFilter, tierFilter])

  const selectedItem = selectedId !== undefined ? itemsById.get(selectedId) : undefined
  const comparedItems = useMemo(() => compareIds.map((id) => itemsById.get(id)).filter((item): item is Item => Boolean(item)), [compareIds])
  const activeLoadout = useMemo(
    () => loadouts.find((loadout) => loadout.id === activeLoadoutId) ?? null,
    [activeLoadoutId, loadouts]
  )

  const selectItem = useCallback(
    (id: number) => {
      setSelectedPrefixId('')
      if (isMobile) {
        setShowFilters(false)
      }
      navigate(`/items/${id}`, { replace: true })
    },
    [navigate, isMobile]
  )

  function toggleCompare(itemIdToToggle: number) {
    setCompareIds((prev) => {
      if (prev.includes(itemIdToToggle)) {
        return prev.filter((id) => id !== itemIdToToggle)
      }

      if (prev.length >= MAX_COMPARE_ITEMS) {
        return [...prev.slice(1), itemIdToToggle]
      }

      return [...prev, itemIdToToggle]
    })
  }

  const assignItemToLoadout = useCallback(
    (item: Item, target: LoadoutSlotTarget) => {
      if (!activeLoadoutId) {
        return
      }

      if (target === 'weapon') {
        setWeapon(activeLoadoutId, item.id)
        return
      }

      if (target === 'armor-head') {
        setArmorSlot(activeLoadoutId, 0, item.id)
        return
      }

      if (target === 'armor-body') {
        setArmorSlot(activeLoadoutId, 1, item.id)
        return
      }

      if (target === 'armor-legs') {
        setArmorSlot(activeLoadoutId, 2, item.id)
        return
      }

      const accessoryIndex = Number.parseInt(target.replace('accessory-', ''), 10)
      if (!Number.isNaN(accessoryIndex)) {
        setAccessorySlot(activeLoadoutId, accessoryIndex, item.id)
      }
    },
    [activeLoadoutId, setAccessorySlot, setArmorSlot, setWeapon]
  )

  // keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>('input[type="text"]')
        input?.focus()
      }
      if (!displayItems.length) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const idx = displayItems.findIndex((i) => i.id === selectedId)
        const next = e.key === 'ArrowDown'
          ? Math.min(idx + 1, displayItems.length - 1)
          : Math.max(idx - 1, 0)
        selectItem(displayItems[next].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [displayItems, selectedId, selectItem])

  const filtersVisible = !isMobile || showFilters

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="font-pixel text-terra-gold text-sm">Item Lookup</h1>

      <div className={`flex flex-col gap-4 ${isMobile ? '' : 'md:flex-row'} ${isMobile ? '' : isTablet ? 'h-[calc(100vh-190px)]' : 'h-[calc(100vh-160px)]'}`}>
        {/* Left panel */}
        <div className={`${isMobile ? 'w-full' : isTablet ? 'md:w-72' : 'md:w-72 lg:w-80'} flex flex-col gap-3 shrink-0`}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search items… (press /)"
            autoFocus
          />

          {isMobile && (
            <button
              onClick={() => setShowFilters((visible) => !visible)}
              className="inline-flex items-center justify-center gap-2 border border-terra-border bg-terra-surface rounded px-3 py-2.5 min-h-11 text-xs text-gray-300 hover:text-terra-gold hover:border-terra-gold transition-colors"
              aria-expanded={filtersVisible}
              aria-controls="item-lookup-filters"
            >
              <Filter className="w-3.5 h-3.5" />
              {filtersVisible ? 'Hide Filters' : 'Show Filters'}
            </button>
          )}

          {filtersVisible && (
            <div id="item-lookup-filters" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value as ItemClassFilter)}
                className="bg-terra-bg border border-terra-border rounded px-2 py-2 text-xs text-white focus:border-terra-gold focus:outline-none"
                aria-label="Filter by class"
              >
                <option value="all">All Classes</option>
                <option value="melee">Melee</option>
                <option value="ranged">Ranged</option>
                <option value="magic">Magic</option>
                <option value="summoner">Summoner</option>
                <option value="utility">Utility</option>
              </select>
              <select
                value={damageFilter}
                onChange={(e) => setDamageFilter(e.target.value as DamageFilter)}
                className="bg-terra-bg border border-terra-border rounded px-2 py-2 text-xs text-white focus:border-terra-gold focus:outline-none"
                aria-label="Filter by damage profile"
              >
                <option value="all">All Damage</option>
                <option value="has-damage">Has Damage</option>
                <option value="non-damage">Non-Damage</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
                className="bg-terra-bg border border-terra-border rounded px-2 py-2 text-xs text-white focus:border-terra-gold focus:outline-none"
                aria-label="Filter by source"
              >
                <option value="all">All Sources</option>
                <option value="crafted">Crafted</option>
                <option value="drop">Drops</option>
                <option value="vendor">Vendors</option>
                <option value="event">Events</option>
                <option value="exploration">Exploration</option>
              </select>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as TierFilter)}
                className="bg-terra-bg border border-terra-border rounded px-2 py-2 text-xs text-white focus:border-terra-gold focus:outline-none"
                aria-label="Filter by progression tier"
              >
                <option value="all">All Tiers</option>
                <option value="early-game">Early Game</option>
                <option value="pre-hardmode">Pre-Hardmode</option>
                <option value="early-hardmode">Early Hardmode</option>
                <option value="endgame">Endgame</option>
              </select>
            </div>
          )}

          <div
            ref={listRef}
            className={`${isMobile ? 'max-h-[42vh]' : 'flex-1'} overflow-y-auto space-y-1.5 pr-1`
            }
          >
            {displayItems.length === 0 && query.trim().length >= 2 && (
              <p className="text-gray-500 text-sm text-center py-8">No items found.</p>
            )}
            {displayItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                prefixLabel={item.id === selectedId && selectedPrefixId ? prefixesById.get(selectedPrefixId)?.name : undefined}
                onClick={() => selectItem(item.id)}
              />
            ))}
          </div>

          {!query && (
            <p className="text-gray-600 text-xs text-center">
              Showing {RECENT_COUNT} of {items.length} items. Type to search.
            </p>
          )}
        </div>

        {/* Right panel */}
        <div className={`flex-1 bg-terra-surface border border-terra-border rounded-lg ${isMobile ? 'p-4' : 'p-5'} overflow-y-auto`}>
          {comparedItems.length > 0 && (
            <div className="mb-5 bg-terra-bg border border-terra-border rounded-lg p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-terra-gold text-xs font-pixel">Compare Items ({comparedItems.length}/{MAX_COMPARE_ITEMS})</h3>
                <button
                  onClick={() => setCompareIds([])}
                  className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1.5 min-h-9 rounded"
                >
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {comparedItems.map((item) => {
                  const first = comparedItems[0]
                  return (
                    <div key={`compare-${item.id}`} className="border border-terra-border rounded p-2">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <button
                          onClick={() => selectItem(item.id)}
                          className="text-sm font-semibold text-terra-sky hover:text-terra-gold transition-colors text-left"
                        >
                          {item.name}
                        </button>
                        <button
                          onClick={() => toggleCompare(item.id)}
                          className="text-gray-500 hover:text-white p-1.5 min-h-8 min-w-8 rounded"
                          aria-label={`Remove ${item.name} from compare`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Damage: <span className={compareStat(item.damage, first?.damage) === 'win' ? 'text-green-400' : compareStat(item.damage, first?.damage) === 'lose' ? 'text-red-400' : 'text-gray-300'}>{item.damage ?? '-'}</span></div>
                        <div>Defense: <span className={compareStat(item.defense, first?.defense) === 'win' ? 'text-green-400' : compareStat(item.defense, first?.defense) === 'lose' ? 'text-red-400' : 'text-gray-300'}>{item.defense ?? '-'}</span></div>
                        <div>Use Time: <span className="text-gray-300">{item.useTime ?? '-'}</span></div>
                        <div>Crit: <span className="text-gray-300">{item.critChance !== undefined ? `${item.critChance}%` : '-'}</span></div>
                        <div>Tier: <span className="text-gray-300 capitalize">{item.progressionTier ?? 'unknown'}</span></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {selectedItem ? (
            <ItemDetailPanel
              key={selectedItem.id}
              item={selectedItem}
              onItemClick={selectItem}
              selectedPrefixId={selectedPrefixId}
              onPrefixChange={setSelectedPrefixId}
              onCompareToggle={toggleCompare}
              compareSelected={compareIds.includes(selectedItem.id)}
              activeLoadoutName={activeLoadout?.name ?? null}
              onAssignToLoadout={assignItemToLoadout}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Package className="w-12 h-12 text-terra-border mb-3" />
              <p className="text-gray-500 text-sm">Select an item to see details</p>
              <p className="text-gray-600 text-xs mt-1">Use / to focus search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
