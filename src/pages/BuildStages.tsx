import { useEffect, useMemo, useState } from 'react'
import { Sword, Shield, Zap, Star } from 'lucide-react'
import type { BuildClass } from '@/types/boss'
import type { Difficulty, StageName, WorldEvil } from '@/types/build'
import { Link, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/cn'
import {
  difficultyOptions,
  getFilteredStageBuilds,
  progressionCaps,
  worldEvilOptions,
} from '@/data/builds'
import { items } from '@/data/index'

const classes: BuildClass[] = ['melee', 'ranged', 'magic', 'summoner']
const stageOrder: StageName[] = progressionCaps.map((cap) => cap.stage)

type StageFocus = StageName | 'all'
type SortMode = 'progression' | 'impact'
type DensityMode = 'cozy' | 'compact'

const STORAGE_KEY = 'terraria-build-stages-preferences'

interface StoredBuildStagePreferences {
  selectedClass?: BuildClass
  worldEvil?: WorldEvil
  difficulty?: Difficulty
  progressionCap?: StageName
  stageFocus?: StageFocus
  gearQuery?: string
  variantOnly?: boolean
  sortMode?: SortMode
  density?: DensityMode
}

const classConfig: Record<BuildClass, { label: string; icon: React.ElementType; color: string; description: string }> = {
  melee: {
    label: 'Melee',
    icon: Sword,
    color: 'text-terra-red',
    description: 'High defense and close-range burst damage.',
  },
  ranged: {
    label: 'Ranged',
    icon: Shield,
    color: 'text-terra-green',
    description: 'Safe positioning with strong sustained damage.',
  },
  magic: {
    label: 'Magic',
    icon: Zap,
    color: 'text-terra-purple',
    description: 'Flexible damage tools with mana management.',
  },
  summoner: {
    label: 'Summoner',
    icon: Star,
    color: 'text-terra-gold',
    description: 'Minion-focused damage with support mobility.',
  },
}


function normalizeGearName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

const itemIdByNormalizedName = new Map(
  items.map((item) => [normalizeGearName(item.name), item.id])
)

function resolveGearItemId(name: string): number | undefined {
  return itemIdByNormalizedName.get(normalizeGearName(name))
}

function isBuildClass(value: string | null): value is BuildClass {
  return value === 'melee' || value === 'ranged' || value === 'magic' || value === 'summoner'
}

function isWorldEvil(value: string | null): value is WorldEvil {
  return value === 'corruption' || value === 'crimson'
}

function isDifficulty(value: string | null): value is Difficulty {
  return value === 'classic' || value === 'expert' || value === 'master'
}

function isStageName(value: string | null): value is StageName {
  return progressionCaps.some((cap) => cap.stage === value)
}

function isStageFocus(value: string | null): value is StageFocus {
  return value === 'all' || isStageName(value)
}

function isSortMode(value: string | null): value is SortMode {
  return value === 'progression' || value === 'impact'
}

function isDensityMode(value: string | null): value is DensityMode {
  return value === 'cozy' || value === 'compact'
}

function readStoredPreferences(): StoredBuildStagePreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as {
      selectedClass?: string
      worldEvil?: string
      difficulty?: string
      progressionCap?: string
      stageFocus?: string
      gearQuery?: string
      variantOnly?: boolean
      sortMode?: string
      density?: string
    }

    const selectedClassCandidate = parsed.selectedClass ?? null
    const worldEvilCandidate = parsed.worldEvil ?? null
    const difficultyCandidate = parsed.difficulty ?? null
    const progressionCapCandidate = parsed.progressionCap ?? null
    const stageFocusCandidate = parsed.stageFocus ?? null
    const sortModeCandidate = parsed.sortMode ?? null
    const densityCandidate = parsed.density ?? null

    const selectedClass = isBuildClass(selectedClassCandidate) ? selectedClassCandidate : undefined
    const worldEvil = isWorldEvil(worldEvilCandidate) ? worldEvilCandidate : undefined
    const difficulty = isDifficulty(difficultyCandidate) ? difficultyCandidate : undefined
    const progressionCap = isStageName(progressionCapCandidate) ? progressionCapCandidate : undefined
    const stageFocus = isStageFocus(stageFocusCandidate) ? stageFocusCandidate : undefined
    const sortMode = isSortMode(sortModeCandidate) ? sortModeCandidate : undefined
    const density = isDensityMode(densityCandidate) ? densityCandidate : undefined

    return {
      selectedClass,
      worldEvil,
      difficulty,
      progressionCap,
      stageFocus,
      gearQuery: typeof parsed.gearQuery === 'string' ? parsed.gearQuery : undefined,
      variantOnly: typeof parsed.variantOnly === 'boolean' ? parsed.variantOnly : undefined,
      sortMode,
      density,
    }
  } catch {
    return {}
  }
}

function GearPill({ name }: { name: string }) {
  const itemId = resolveGearItemId(name)

  if (!itemId) {
    return (
      <span className="inline-flex items-center bg-terra-surface border border-terra-border rounded px-2 py-1 text-xs text-gray-300">
        {name}
      </span>
    )
  }

  return (
    <Link
      to={`/items/${itemId}`}
      className="inline-flex items-center bg-terra-surface border border-terra-border rounded px-2 py-1 text-xs text-terra-sky hover:text-terra-gold hover:border-terra-gold transition-colors"
      title="Open in Item Lookup"
    >
      {name}
    </Link>
  )
}
export default function BuildStages() {
  const [searchParams, setSearchParams] = useSearchParams()
  const stored = useMemo(() => readStoredPreferences(), [])

  const [selectedClass, setSelectedClass] = useState<BuildClass>(() => {
    const fromUrl = searchParams.get('class')
    if (isBuildClass(fromUrl)) {
      return fromUrl
    }
    return stored.selectedClass ?? 'melee'
  })
  const [worldEvil, setWorldEvil] = useState<WorldEvil>(() => {
    const fromUrl = searchParams.get('evil')
    if (isWorldEvil(fromUrl)) {
      return fromUrl
    }
    return stored.worldEvil ?? 'corruption'
  })
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const fromUrl = searchParams.get('difficulty')
    if (isDifficulty(fromUrl)) {
      return fromUrl
    }
    return stored.difficulty ?? 'classic'
  })
  const [progressionCap, setProgressionCap] = useState<StageName>(() => {
    const fromUrl = searchParams.get('cap')
    if (isStageName(fromUrl)) {
      return fromUrl
    }
    return stored.progressionCap ?? 'Endgame'
  })
  const [stageFocus, setStageFocus] = useState<StageFocus>(() => {
    const fromUrl = searchParams.get('stage')
    if (isStageFocus(fromUrl)) {
      return fromUrl
    }
    return stored.stageFocus ?? 'all'
  })
  const [gearQuery, setGearQuery] = useState(() => searchParams.get('q') ?? stored.gearQuery ?? '')
  const [variantOnly, setVariantOnly] = useState(() => {
    const fromUrl = searchParams.get('variant')
    if (fromUrl === '1') {
      return true
    }
    if (fromUrl === '0') {
      return false
    }
    return stored.variantOnly ?? false
  })
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    const fromUrl = searchParams.get('sort')
    if (isSortMode(fromUrl)) {
      return fromUrl
    }
    return stored.sortMode ?? 'progression'
  })
  const [density, setDensity] = useState<DensityMode>(() => {
    const fromUrl = searchParams.get('view')
    if (isDensityMode(fromUrl)) {
      return fromUrl
    }
    return stored.density ?? 'cozy'
  })
  const [compareStage, setCompareStage] = useState<StageName>('Early Game')
  const [clipboardMessage, setClipboardMessage] = useState('')

  const { label, icon: Icon, color, description } = classConfig[selectedClass]

  const baseBuilds = useMemo(
    () => getFilteredStageBuilds(selectedClass, {
      worldEvil,
      difficulty,
      progressionCap,
    }),
    [selectedClass, worldEvil, difficulty, progressionCap]
  )

  const visibleBuilds = useMemo(() => {
    const loweredQuery = gearQuery.trim().toLowerCase()

    let next = [...baseBuilds]

    if (stageFocus !== 'all') {
      next = next.filter((entry) => entry.stage === stageFocus)
    }

    if (variantOnly) {
      next = next.filter((entry) => entry.adjustments.length > 0)
    }

    if (loweredQuery) {
      next = next.filter((entry) => {
        const haystack = [entry.armor, entry.weapon, ...entry.accessories, entry.note, ...entry.why]
          .join(' ')
          .toLowerCase()
        return haystack.includes(loweredQuery)
      })
    }

    if (sortMode === 'impact') {
      next.sort((a, b) => {
        if (b.adjustments.length !== a.adjustments.length) {
          return b.adjustments.length - a.adjustments.length
        }
        return stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage)
      })
    }

    return next
  }, [baseBuilds, stageFocus, variantOnly, gearQuery, sortMode])

  const compareStageOptions = useMemo(
    () => (visibleBuilds.length > 0 ? visibleBuilds.map((entry) => entry.stage) : ['Early Game']),
    [visibleBuilds]
  )

  const activeCompareStage = compareStageOptions.includes(compareStage)
    ? compareStage
    : compareStageOptions[0]

  const compareRows = useMemo(
    () => classes.map((buildClass) => {
      const stageBuild = getFilteredStageBuilds(buildClass, {
        worldEvil,
        difficulty,
        progressionCap,
      }).find((entry) => entry.stage === activeCompareStage)

      return {
        buildClass,
        stageBuild,
      }
    }),
    [worldEvil, difficulty, progressionCap, activeCompareStage]
  )

  useEffect(() => {
    if (clipboardMessage.length === 0) {
      return
    }

    const timeout = window.setTimeout(() => setClipboardMessage(''), 1800)
    return () => window.clearTimeout(timeout)
  }, [clipboardMessage])

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedClass,
        worldEvil,
        difficulty,
        progressionCap,
        stageFocus,
        gearQuery,
        variantOnly,
        sortMode,
        density,
      })
    )
  }, [selectedClass, worldEvil, difficulty, progressionCap, stageFocus, gearQuery, variantOnly, sortMode, density])

  useEffect(() => {
    const next = new URLSearchParams()

    if (selectedClass !== 'melee') {
      next.set('class', selectedClass)
    }

    if (worldEvil !== 'corruption') {
      next.set('evil', worldEvil)
    }

    if (difficulty !== 'classic') {
      next.set('difficulty', difficulty)
    }

    if (progressionCap !== 'Endgame') {
      next.set('cap', progressionCap)
    }

    if (stageFocus !== 'all') {
      next.set('stage', stageFocus)
    }

    if (gearQuery.trim().length > 0) {
      next.set('q', gearQuery.trim())
    }

    if (variantOnly) {
      next.set('variant', '1')
    }

    if (sortMode !== 'progression') {
      next.set('sort', sortMode)
    }

    if (density !== 'cozy') {
      next.set('view', density)
    }

    setSearchParams(next, { replace: true })
  }, [
    selectedClass,
    worldEvil,
    difficulty,
    progressionCap,
    stageFocus,
    gearQuery,
    variantOnly,
    sortMode,
    density,
    setSearchParams,
  ])

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setClipboardMessage('Link copied')
    } catch {
      setClipboardMessage('Clipboard blocked')
    }
  }

  async function copyMarkdownSummary() {
    const lines: string[] = [
      `# Recommended Builds: ${label}`,
      '',
      `Filters: world=${worldEvil}, difficulty=${difficulty}, cap=${progressionCap}, stage=${stageFocus}, variantsOnly=${variantOnly ? 'yes' : 'no'}, sort=${sortMode}`,
      '',
    ]

    for (const entry of visibleBuilds) {
      lines.push(`## ${entry.stage}`)
      lines.push(`- Armor: ${entry.armor}`)
      lines.push(`- Weapon: ${entry.weapon}`)
      lines.push(`- Accessories: ${entry.accessories.join(', ')}`)
      if (entry.adjustments.length > 0) {
        lines.push(`- Adjustments: ${entry.adjustments.join(', ')}`)
      }
      if (entry.why.length > 0) {
        lines.push(`- Why: ${entry.why.join(' | ')}`)
      }
      lines.push(`- Note: ${entry.note}`)
      lines.push('')
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setClipboardMessage('Summary copied')
    } catch {
      setClipboardMessage('Clipboard blocked')
    }
  }

  function resetFilters() {
    setSelectedClass('melee')
    setWorldEvil('corruption')
    setDifficulty('classic')
    setProgressionCap('Endgame')
    setStageFocus('all')
    setGearQuery('')
    setVariantOnly(false)
    setSortMode('progression')
    setDensity('cozy')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <h1 className="font-pixel text-terra-gold text-sm">Recommended Builds</h1>

      <div className="bg-terra-surface border border-terra-border rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Icon className={cn('w-5 h-5', color)} />
            <h2 className="text-white font-semibold">{label} Progression</h2>
          </div>
          <div className="flex flex-wrap gap-1">
            {classes.map((buildClass) => {
              const cfg = classConfig[buildClass]
              const ClassIcon = cfg.icon
              return (
                <button
                  key={buildClass}
                  onClick={() => setSelectedClass(buildClass)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded text-sm font-semibold transition-colors',
                    selectedClass === buildClass
                      ? 'bg-terra-panel text-terra-gold border border-terra-gold'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  )}
                >
                  <ClassIcon className={cn('w-4 h-4', cfg.color)} />
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
        <p className="text-sm text-gray-400">{description}</p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-gray-500">Filter state is synced to URL for sharing.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyShareLink}
              className="px-2 py-1 rounded border border-terra-border text-gray-300 hover:text-white hover:border-terra-gold transition-colors"
            >
              Copy Link
            </button>
            <button
              onClick={copyMarkdownSummary}
              className="px-2 py-1 rounded border border-terra-border text-gray-300 hover:text-white hover:border-terra-gold transition-colors"
            >
              Copy Summary
            </button>
            <button
              onClick={resetFilters}
              className="px-2 py-1 rounded border border-terra-border text-gray-300 hover:text-white hover:border-terra-gold transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {clipboardMessage ? (
          <p className="mt-2 text-xs text-terra-gold">{clipboardMessage}</p>
        ) : null}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-terra-bg border border-terra-border rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400 mb-1">World Evil</p>
            <div className="flex gap-1">
              {worldEvilOptions.map((evil) => (
                <button
                  key={evil}
                  onClick={() => setWorldEvil(evil)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold transition-colors capitalize',
                    worldEvil === evil
                      ? 'bg-terra-panel text-terra-gold border border-terra-gold'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  )}
                >
                  {evil}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-terra-bg border border-terra-border rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400 mb-1">Difficulty</p>
            <div className="flex gap-1">
              {difficultyOptions.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDifficulty(mode)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold transition-colors capitalize',
                    difficulty === mode
                      ? 'bg-terra-panel text-terra-gold border border-terra-gold'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-terra-bg border border-terra-border rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400 mb-1">Progression Cap</p>
            <select
              value={progressionCap}
              onChange={(e) => setProgressionCap(e.target.value as StageName)}
              className="w-full bg-terra-surface border border-terra-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-terra-gold"
            >
              {progressionCaps.map((cap) => (
                <option key={cap.stage} value={cap.stage}>{cap.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="bg-terra-bg border border-terra-border rounded-lg px-3 py-2 md:col-span-2">
            <p className="text-xs text-gray-400 mb-1">Filter Gear / Notes</p>
            <input
              value={gearQuery}
              onChange={(e) => setGearQuery(e.target.value)}
              placeholder="Search item names or notes..."
              className="w-full bg-terra-surface border border-terra-border rounded px-2 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-terra-gold"
            />
          </div>

          <div className="bg-terra-bg border border-terra-border rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400 mb-1">Stage Focus</p>
            <select
              value={stageFocus}
              onChange={(e) => setStageFocus(e.target.value as StageFocus)}
              className="w-full bg-terra-surface border border-terra-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-terra-gold"
            >
              <option value="all">All Visible Stages</option>
              {progressionCaps.map((cap) => (
                <option key={cap.stage} value={cap.stage}>{cap.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-terra-bg border border-terra-border rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400 mb-1">Sort</p>
            <div className="flex gap-1">
              {(['progression', 'impact'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold transition-colors capitalize',
                    sortMode === mode
                      ? 'bg-terra-panel text-terra-gold border border-terra-gold'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-terra-bg border border-terra-border rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400 mb-1">View</p>
            <div className="flex gap-1">
              {(['cozy', 'compact'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDensity(mode)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-semibold transition-colors capitalize',
                    density === mode
                      ? 'bg-terra-panel text-terra-gold border border-terra-gold'
                      : 'text-gray-400 hover:text-white border border-transparent'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setVariantOnly((v) => !v)}
            className={cn(
              'px-2 py-1 rounded text-xs font-semibold transition-colors border',
              variantOnly
                ? 'bg-terra-panel text-terra-gold border-terra-gold'
                : 'text-gray-400 hover:text-white border-terra-border'
            )}
          >
            Variant Only
          </button>
          <p className="text-xs text-gray-500">Showing {visibleBuilds.length} stage{visibleBuilds.length === 1 ? '' : 's'}</p>
        </div>

        {visibleBuilds.length > 0 ? (
          <div className="mt-4 bg-terra-bg border border-terra-border rounded-lg p-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
              <h3 className="text-sm text-white font-semibold">Class Compare Snapshot</h3>
              <select
                value={activeCompareStage}
                onChange={(e) => setCompareStage(e.target.value as StageName)}
                className="bg-terra-surface border border-terra-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-terra-gold"
              >
                {compareStageOptions.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
              {compareRows.map(({ buildClass, stageBuild }) => {
                const cfg = classConfig[buildClass]
                const ClassIcon = cfg.icon

                return (
                  <div key={buildClass} className="border border-terra-border rounded p-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ClassIcon className={cn('w-3.5 h-3.5', cfg.color)} />
                      <span className="text-xs text-white font-semibold">{cfg.label}</span>
                    </div>
                    {stageBuild ? (
                      <>
                        <p className="text-[11px] text-gray-400">Armor</p>
                        <p className="text-xs text-gray-200 mb-1">{stageBuild.armor}</p>
                        <p className="text-[11px] text-gray-400">Weapon</p>
                        <p className="text-xs text-gray-200">{stageBuild.weapon}</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Unavailable at current cap.</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {visibleBuilds.length === 0 ? (
            <div className="md:col-span-2 xl:col-span-4 bg-terra-bg border border-terra-border rounded-lg p-4 text-sm text-gray-400">
              No builds match the current filters. Try broadening stage focus, disabling Variant Only, or clearing search.
            </div>
          ) : null}
          {visibleBuilds.map((entry) => (
            <div key={entry.stage} className={cn('bg-terra-bg border border-terra-border rounded-lg', density === 'compact' ? 'p-2.5' : 'p-3')}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-white">{entry.stage}</h3>
                {entry.adjustments.length > 0 ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-terra-gold/50 text-terra-gold bg-terra-panel/60 whitespace-nowrap">
                    Variant
                  </span>
                ) : null}
              </div>

              {entry.adjustments.length > 0 ? (
                <div className="flex flex-wrap gap-1 mb-2">
                  {entry.adjustments.map((label) => (
                    <span
                      key={label}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-terra-border text-gray-300 bg-terra-surface"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="text-xs text-gray-400 mb-1">Armor</p>
              <div className="mb-2">
                <GearPill name={entry.armor} />
              </div>
              <p className="text-xs text-gray-400 mb-1">Weapon</p>
              <div className="mb-2">
                <GearPill name={entry.weapon} />
              </div>
              <p className="text-xs text-gray-400 mb-1">Accessories</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {entry.accessories.map((accessory, index) => (
                  <GearPill key={`${entry.stage}-${accessory}-${index}`} name={accessory} />
                ))}
              </div>

              {entry.why.length > 0 && density === 'cozy' ? (
                <>
                  <p className="text-xs text-gray-400 mb-1">Why this build</p>
                  <ul className="text-xs text-gray-300 space-y-1 mb-2 list-disc list-inside">
                    {entry.why.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              <p className="text-xs text-gray-500 leading-relaxed">{entry.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
