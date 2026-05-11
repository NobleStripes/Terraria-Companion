import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Circle, ChevronDown, ChevronUp, RotateCcw, Shield, Sword, Zap, Star } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useBosses } from '@/hooks/useBosses'
import { useViewport } from '@/hooks/useViewport'
import { cn } from '@/lib/cn'
import type { Boss, BossDropStatus, BossPrepChecklist, BuildClass, GamePhase, PrepChecklistKey } from '@/types/boss'
import { itemsById } from '@/data/index'
import type { StageName } from '@/types/build'

const phaseLabels: Record<GamePhase, string> = {
  'pre-hardmode': 'Pre-Hardmode',
  hardmode: 'Hardmode',
  'post-moonlord': 'Post-Moon Lord',
}

const phaseColors: Record<GamePhase, string> = {
  'pre-hardmode': 'text-terra-green',
  hardmode: 'text-terra-gold',
  'post-moonlord': 'text-terra-red',
}

const classIcons: Record<BuildClass, React.ElementType> = {
  melee: Sword,
  ranged: Shield,
  magic: Zap,
  summoner: Star,
}

const classColors: Record<BuildClass, string> = {
  melee: 'text-terra-red',
  ranged: 'text-terra-green',
  magic: 'text-terra-purple',
  summoner: 'text-terra-gold',
}

const strategySectionLabels = {
  arena: 'Arena Setup',
  mobility: 'Mobility',
  buffs: 'Buffs',
  dangerWindows: 'Danger Windows',
  execution: 'Execution',
} as const

const prepChecklistLabels: Record<PrepChecklistKey, string> = {
  arena: 'Arena',
  buffs: 'Buffs',
  summon: 'Summon',
  mobility: 'Mobility',
}

const prepChecklistOrder: PrepChecklistKey[] = ['arena', 'buffs', 'summon', 'mobility']
type DropFilter = 'all' | 'wished' | 'missing' | 'acquired'

const dropFilters: DropFilter[] = ['all', 'wished', 'missing', 'acquired']

const dropFilterLabels: Record<DropFilter, string> = {
  all: 'All Drops',
  wished: 'Wishlist',
  missing: 'Missing',
  acquired: 'Acquired',
}

function isBuildClass(value: string | null): value is BuildClass {
  return value === 'melee' || value === 'ranged' || value === 'magic' || value === 'summoner'
}

function isDropFilter(value: string | null): value is DropFilter {
  return value === 'all' || value === 'wished' || value === 'missing' || value === 'acquired'
}

function shouldRenderDrop(status: BossDropStatus, dropFilter: DropFilter): boolean {
  if (dropFilter === 'all') {
    return true
  }

  if (dropFilter === 'wished') {
    return status === 'wished'
  }

  if (dropFilter === 'missing') {
    return status === 'wished'
  }

  return status === 'acquired'
}

function GearList({
  title,
  titleClass,
  entries,
  onItemClick,
}: {
  title: string
  titleClass: string
  entries: number[]
  onItemClick: (itemId: number) => void
}) {
  return (
    <div>
      <h5 className={cn('text-xs font-semibold mb-2 uppercase', titleClass)}>{title}</h5>
      <div className="flex flex-wrap gap-1.5">
        {entries.map((entryId) => {
          const item = itemsById.get(entryId)

          if (!item) {
            return (
              <span key={entryId} className="bg-terra-bg border border-terra-border rounded px-2 py-1 text-xs text-gray-300">
                Unknown Item #{entryId}
              </span>
            )
          }

          return (
            <button
              key={entryId}
              onClick={() => onItemClick(entryId)}
              className="bg-terra-bg border border-terra-border rounded px-2 py-1 text-xs text-terra-sky hover:text-terra-gold hover:border-terra-gold transition-colors"
              title="Open in Item Lookup"
            >
              {item.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function GearTab({
  boss,
  selectedClass,
  onClassChange,
  onItemClick,
}: {
  boss: Boss
  selectedClass: BuildClass
  onClassChange: (c: BuildClass) => void
  onItemClick: (itemId: number) => void
}) {
  const classes: BuildClass[] = ['melee', 'ranged', 'magic', 'summoner']
  const gear = boss.recommendedGear.find((g) => g.class === selectedClass)

  const primary = gear
    ? {
        armor: gear.armor.slice(0, 1),
        weapons: gear.weapons.slice(0, 1),
        accessories: gear.accessories.slice(0, 1),
      }
    : undefined

  const alternate = gear
    ? {
        armor: gear.alternate?.armor ?? gear.armor.slice(1),
        weapons: gear.alternate?.weapons ?? gear.weapons.slice(1),
        accessories: gear.alternate?.accessories ?? gear.accessories.slice(1),
      }
    : undefined

  const hasAlternate = Boolean(
    alternate &&
    (alternate.armor.length > 0 || alternate.weapons.length > 0 || alternate.accessories.length > 0)
  )

  function getRecommendedStageForBoss(targetBoss: Boss): StageName {
    if (targetBoss.phase === 'pre-hardmode') {
      return targetBoss.id === 'wall-of-flesh' ? 'Pre-Hardmode' : 'Early Game'
    }

    if (targetBoss.phase === 'hardmode') {
      if (targetBoss.id === 'lunatic-cultist' || targetBoss.id === 'moon-lord') {
        return 'Endgame'
      }
      return 'Early Hardmode'
    }

    return 'Endgame'
  }

  const recommendedStage = getRecommendedStageForBoss(boss)

  return (
    <div>
      <div className="flex gap-1 mb-4 border-b border-terra-border pb-2">
        {classes.map((c) => {
          const Icon = classIcons[c]
          return (
            <button
              key={c}
              onClick={() => onClassChange(c)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold capitalize transition-colors',
                selectedClass === c
                  ? 'bg-terra-panel text-terra-gold'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', classColors[c])} />
              {c}
            </button>
          )
        })}
      </div>
      {gear ? (
        <div className="space-y-5 text-sm">
          <div>
            <h4 className="text-terra-gold text-xs font-pixel mb-2">Recommended Gear</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GearList title="Armor" titleClass="text-terra-gold" entries={primary?.armor ?? []} onItemClick={onItemClick} />
              <GearList title="Weapons" titleClass="text-terra-gold" entries={primary?.weapons ?? []} onItemClick={onItemClick} />
              <GearList title="Accessories" titleClass="text-terra-gold" entries={primary?.accessories ?? []} onItemClick={onItemClick} />
            </div>
          </div>

          {hasAlternate && (
            <div>
              <h4 className="text-terra-sky text-xs font-pixel mb-2">Alternate Gear</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GearList title="Armor" titleClass="text-terra-sky" entries={alternate?.armor ?? []} onItemClick={onItemClick} />
                <GearList title="Weapons" titleClass="text-terra-sky" entries={alternate?.weapons ?? []} onItemClick={onItemClick} />
                <GearList title="Accessories" titleClass="text-terra-sky" entries={alternate?.accessories ?? []} onItemClick={onItemClick} />
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Tip: Primary recommendations are listed first; additional options appear under Alternate Gear.
          </div>
          <div className="text-xs text-gray-400">
            Recommended build stage:{' '}
            <Link
              to={`/build?class=${selectedClass}&stage=${encodeURIComponent(recommendedStage)}&cap=${encodeURIComponent(recommendedStage)}`}
              className="text-terra-sky hover:text-terra-gold transition-colors"
            >
              {recommendedStage}
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No gear data for this class.</p>
      )}
    </div>
  )
}

type DrawerTab = 'overview' | 'gear' | 'tips'

function BossDrawer({
  boss,
  onClose,
  onItemClick,
  gearClass,
  onGearClassChange,
  checklist,
  prepCompleted,
  prepTotal,
  onToggleChecklistItem,
  onSetChecklistReady,
  onResetChecklist,
  dropFilter,
  onDropFilterChange,
  getDropStatus,
  onToggleDropWish,
  onToggleDropAcquired,
  onResetDrops,
  isMobile,
  isTablet,
}: {
  boss: Boss
  onClose: () => void
  onItemClick: (itemId: number) => void
  gearClass: BuildClass
  onGearClassChange: (value: BuildClass) => void
  checklist: BossPrepChecklist
  prepCompleted: number
  prepTotal: number
  onToggleChecklistItem: (key: PrepChecklistKey) => void
  onSetChecklistReady: () => void
  onResetChecklist: () => void
  dropFilter: DropFilter
  onDropFilterChange: (value: DropFilter) => void
  getDropStatus: (dropName: string) => BossDropStatus
  onToggleDropWish: (dropName: string) => void
  onToggleDropAcquired: (dropName: string) => void
  onResetDrops: () => void
  isMobile: boolean
  isTablet: boolean
}) {
  const [tab, setTab] = useState<DrawerTab>('overview')
  const tabs: DrawerTab[] = ['overview', 'gear', 'tips']
  const headingId = `boss-drawer-title-${boss.id}`

  return (
    <div className="fixed inset-0 z-50 flex justify-end items-end md:items-stretch" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <button type="button" className="flex-1 bg-black/60 cursor-default" onClick={onClose} aria-label="Close boss guide" />
      <div className={cn(
        'bg-terra-surface overflow-y-auto flex flex-col',
        isMobile
          ? 'w-full h-[88vh] border-t border-x border-terra-border rounded-t-2xl'
          : isTablet
            ? 'w-full max-w-xl border-l border-terra-border'
            : 'w-full max-w-lg border-l border-terra-border'
      )}>
        <div className={cn('border-b border-terra-border', isMobile ? 'p-4' : 'p-5')}>
          <div className="flex items-center justify-between">
            <h2 id={headingId} className="font-pixel text-terra-gold text-xs">{boss.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none min-h-11 min-w-11 flex items-center justify-center rounded" aria-label="Close boss guide">✕</button>
          </div>
          {boss.summonItem && (
            <p className="text-gray-400 text-xs mt-2">
              Summon: <span className="text-white">{boss.summonItem}</span>
            </p>
          )}
          {boss.summonCondition && (
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">{boss.summonCondition}</p>
          )}
        </div>

        <div className="flex border-b border-terra-border">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2.5 min-h-11 text-xs font-semibold capitalize transition-colors',
                tab === t ? 'text-terra-gold border-b-2 border-terra-gold' : 'text-gray-400 hover:text-white'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className={cn('flex-1', isMobile ? 'p-4' : 'p-5')}>
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-terra-border bg-terra-bg p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-terra-gold text-xs font-pixel">Readiness Checklist</h3>
                  <span className="text-xs text-gray-500">{prepCompleted}/{prepTotal}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {prepChecklistOrder.map((itemKey) => (
                    <button
                      key={itemKey}
                      type="button"
                      onClick={() => onToggleChecklistItem(itemKey)}
                      className={cn(
                        'flex items-center justify-between rounded border px-2.5 py-2 text-xs transition-colors',
                        checklist[itemKey]
                          ? 'border-terra-green text-terra-green bg-terra-panel'
                          : 'border-terra-border text-gray-300 hover:border-terra-gold'
                      )}
                    >
                      <span>{prepChecklistLabels[itemKey]}</span>
                      {checklist[itemKey] ? <CheckCircle className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={onSetChecklistReady}
                    className="text-terra-green hover:text-green-300 transition-colors"
                  >
                    Mark Ready
                  </button>
                  <button
                    type="button"
                    onClick={onResetChecklist}
                    className="text-gray-400 hover:text-terra-red transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {boss.strategySections ? (
                <div className="space-y-3">
                  {(Object.keys(strategySectionLabels) as Array<keyof typeof strategySectionLabels>).map((key) => (
                    <div key={key}>
                      <h3 className="text-terra-gold text-xs font-pixel mb-1">{strategySectionLabels[key]}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{boss.strategySections?.[key]}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-300 text-sm leading-relaxed">{boss.strategy}</p>
              )}
              {boss.drops.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-terra-gold text-xs font-pixel">Notable Drops</h3>
                    <button
                      type="button"
                      onClick={onResetDrops}
                      className="text-xs text-gray-400 hover:text-terra-red transition-colors"
                    >
                      Clear Drops
                    </button>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {dropFilters.map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => onDropFilterChange(filter)}
                        className={cn(
                          'rounded border px-2 py-1 text-[11px] transition-colors',
                          dropFilter === filter
                            ? 'border-terra-gold bg-terra-panel text-terra-gold'
                            : 'border-terra-border text-gray-400 hover:text-white hover:border-terra-gold'
                        )}
                      >
                        {dropFilterLabels[filter]}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {boss.drops
                      .filter((dropName) => shouldRenderDrop(getDropStatus(dropName), dropFilter))
                      .map((dropName) => {
                        const status = getDropStatus(dropName)

                        return (
                          <div key={dropName} className="flex items-center justify-between gap-2 rounded border border-terra-border bg-terra-bg px-2 py-1.5">
                            <span className={cn('text-xs', status === 'acquired' ? 'text-terra-green' : 'text-gray-300')}>{dropName}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onToggleDropWish(dropName)}
                                className={cn(
                                  'rounded border px-2 py-0.5 text-[11px] transition-colors',
                                  status === 'wished'
                                    ? 'border-terra-gold bg-terra-panel text-terra-gold'
                                    : 'border-terra-border text-gray-400 hover:border-terra-gold hover:text-white'
                                )}
                              >
                                Wish
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleDropAcquired(dropName)}
                                className={cn(
                                  'rounded border px-2 py-0.5 text-[11px] transition-colors',
                                  status === 'acquired'
                                    ? 'border-terra-green bg-terra-panel text-terra-green'
                                    : 'border-terra-border text-gray-400 hover:border-terra-green hover:text-white'
                                )}
                              >
                                Got It
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    {boss.drops.filter((dropName) => shouldRenderDrop(getDropStatus(dropName), dropFilter)).length === 0 && (
                      <p className="text-xs text-gray-500">No drops match this filter.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'gear' && (
            <GearTab boss={boss} selectedClass={gearClass} onClassChange={onGearClassChange} onItemClick={onItemClick} />
          )}
          {tab === 'tips' && (
            <ul className="space-y-3">
              {boss.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="text-terra-gold font-bold shrink-0">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function BossCard({
  boss,
  isDefeated,
  prepCompleted,
  prepTotal,
  isPrepReady,
  dropMissing,
  dropAcquired,
  onToggle,
  onOpen,
}: {
  boss: Boss
  isDefeated: boolean
  prepCompleted: number
  prepTotal: number
  isPrepReady: boolean
  dropMissing: number
  dropAcquired: number
  onToggle: () => void
  onOpen: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn(
      'bg-terra-surface border rounded-lg transition-all',
      isDefeated ? 'border-terra-green opacity-70' : 'border-terra-border hover:border-terra-gold'
    )}>
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={onToggle}
          className="shrink-0 text-terra-green hover:scale-110 transition-transform min-h-11 min-w-11 flex items-center justify-center rounded"
          aria-label={isDefeated ? 'Mark as not defeated' : 'Mark as defeated'}
        >
          {isDefeated
            ? <CheckCircle className="w-5 h-5" />
            : <Circle className="w-5 h-5 text-gray-500" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <span className={cn('font-semibold text-sm', isDefeated ? 'line-through text-gray-500' : 'text-white')}>
            {boss.name}
          </span>
          {boss.summonItem && (
            <p className="text-gray-500 text-xs truncate">Summon: {boss.summonItem}</p>
          )}
          <p className={cn('text-xs mt-0.5', isPrepReady ? 'text-terra-green' : 'text-gray-500')}>
            Prep: {prepCompleted}/{prepTotal}
          </p>
          <p className={cn('text-xs mt-0.5', dropMissing > 0 ? 'text-terra-gold' : dropAcquired > 0 ? 'text-terra-green' : 'text-gray-500')}>
            Farm: {dropMissing > 0 ? `${dropMissing} missing` : dropAcquired > 0 ? `${dropAcquired} acquired` : 'not tracked'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpen}
            className="text-xs text-terra-sky hover:text-terra-gold transition-colors px-2.5 py-1.5 min-h-9 border border-terra-border rounded hover:border-terra-gold"
          >
            Guide
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-gray-400 hover:text-white transition-colors min-h-9 min-w-9 flex items-center justify-center rounded"
            aria-label="Toggle drops"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && boss.drops.length > 0 && (
        <div className="px-3 pb-3 pt-0 border-t border-terra-border">
          <p className="text-gray-500 text-xs mb-1.5 mt-2">Notable drops:</p>
          <div className="flex flex-wrap gap-1">
            {boss.drops.map((d) => (
              <span key={d} className="bg-terra-bg border border-terra-border rounded px-2 py-0.5 text-xs text-gray-300">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BossTracker() {
  const { isMobile, isTablet } = useViewport()
  const { bossId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    grouped,
    totalCount,
    defeatedCount,
    readyCount,
    toggleBoss,
    resetAll,
    isDefeated,
    togglePrepItem,
    setPrepAllForBoss,
    resetPrepForBoss,
    getPrepChecklist,
    getPrepCompletion,
    isPrepReady,
    toggleDropWish,
    toggleDropAcquired,
    resetDropsForBoss,
    getDropStatus,
    getBossDropCounts,
  } = useBosses()
  const [confirmReset, setConfirmReset] = useState(false)
  const [gearClass, setGearClass] = useState<BuildClass>(() => {
    const fromUrl = searchParams.get('class')
    return isBuildClass(fromUrl) ? fromUrl : 'melee'
  })
  const [dropFilter, setDropFilter] = useState<DropFilter>(() => {
    const fromUrl = searchParams.get('drops')
    return isDropFilter(fromUrl) ? fromUrl : 'all'
  })

  const phases: GamePhase[] = ['pre-hardmode', 'hardmode', 'post-moonlord']
  const openBoss = useMemo(() => {
    if (!bossId) return undefined
    return Object.values(grouped).flat().find((boss) => boss.id === bossId)
  }, [bossId, grouped])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)

    if (gearClass === 'melee') {
      next.delete('class')
    } else {
      next.set('class', gearClass)
    }

    if (dropFilter === 'all') {
      next.delete('drops')
    } else {
      next.set('drops', dropFilter)
    }

    setSearchParams(next, { replace: true })
  }, [dropFilter, gearClass, searchParams, setSearchParams])

  function openGuide(boss: Boss) {
    const query = searchParams.toString()
    navigate(`/bosses/${boss.id}${query ? `?${query}` : ''}`, { replace: true })
  }

  function closeGuide() {
    const query = searchParams.toString()
    navigate(`/bosses${query ? `?${query}` : ''}`, { replace: true })
  }

  function openItem(itemId: number) {
    navigate(`/items/${itemId}`)
  }

  return (
    <div className={cn('mx-auto px-4 py-6', isTablet ? 'max-w-4xl' : 'max-w-3xl')}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="font-pixel text-terra-gold text-sm">Boss Tracker</h1>
        <button
          onClick={() => setConfirmReset(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-terra-red transition-colors border border-terra-border hover:border-terra-red rounded px-2.5 py-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>

      <ProgressBar value={defeatedCount} max={totalCount} className="mb-8" />
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">Readiness complete: {readyCount}/{totalCount} bosses</p>
        <div className="flex flex-wrap gap-1">
          {dropFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setDropFilter(filter)}
              className={cn(
                'rounded border px-2 py-1 text-[11px] transition-colors',
                dropFilter === filter
                  ? 'border-terra-gold bg-terra-panel text-terra-gold'
                  : 'border-terra-border text-gray-400 hover:text-white hover:border-terra-gold'
              )}
            >
              {dropFilterLabels[filter]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {phases.map((phase) => {
          const phaseBosses = grouped[phase]
          if (!phaseBosses.length) return null
          const phaseDefeated = phaseBosses.filter((b) => isDefeated(b.id)).length
          return (
            <section key={phase}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={cn('font-pixel text-xs', phaseColors[phase])}>
                  {phaseLabels[phase]}
                </h2>
                <span className="text-gray-500 text-xs">{phaseDefeated}/{phaseBosses.length}</span>
              </div>
              <div className="space-y-2">
                {phaseBosses.map((boss) => {
                  const prep = getPrepCompletion(boss.id)
                  const dropCounts = getBossDropCounts(boss.id, boss.drops)

                  return (
                    <BossCard
                      key={boss.id}
                      boss={boss}
                      isDefeated={isDefeated(boss.id)}
                      prepCompleted={prep.completed}
                      prepTotal={prep.total}
                      isPrepReady={isPrepReady(boss.id)}
                      dropMissing={dropCounts.missing}
                      dropAcquired={dropCounts.acquired}
                      onToggle={() => toggleBoss(boss.id)}
                      onOpen={() => openGuide(boss)}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {openBoss && (
        <BossDrawer
          boss={openBoss}
          onClose={closeGuide}
          onItemClick={openItem}
          gearClass={gearClass}
          onGearClassChange={setGearClass}
          checklist={getPrepChecklist(openBoss.id)}
          prepCompleted={getPrepCompletion(openBoss.id).completed}
          prepTotal={getPrepCompletion(openBoss.id).total}
          onToggleChecklistItem={(key) => togglePrepItem(openBoss.id, key)}
          onSetChecklistReady={() => setPrepAllForBoss(openBoss.id)}
          onResetChecklist={() => resetPrepForBoss(openBoss.id)}
          dropFilter={dropFilter}
          onDropFilterChange={setDropFilter}
          getDropStatus={(dropName) => getDropStatus(openBoss.id, dropName)}
          onToggleDropWish={(dropName) => toggleDropWish(openBoss.id, dropName)}
          onToggleDropAcquired={(dropName) => toggleDropAcquired(openBoss.id, dropName)}
          onResetDrops={() => resetDropsForBoss(openBoss.id)}
          isMobile={isMobile}
          isTablet={isTablet}
        />
      )}

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-terra-surface border border-terra-border rounded-xl p-6 max-w-sm w-full mx-4" role="dialog" aria-modal="true" aria-labelledby="boss-reset-title">
            <h3 id="boss-reset-title" className="font-pixel text-terra-red text-xs mb-4">Reset Progress?</h3>
            <p className="text-gray-300 text-sm mb-6">
              This will clear defeated progress, readiness checklist state, and tracked boss drops. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { resetAll(); setConfirmReset(false) }}
                className="flex-1 bg-terra-red text-white rounded py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 border border-terra-border text-gray-300 rounded py-2 text-sm hover:border-terra-gold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
