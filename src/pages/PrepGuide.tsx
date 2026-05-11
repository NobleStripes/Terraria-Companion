import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Copy, Shield, Sword, Zap, Star } from 'lucide-react'
import { bosses, itemsById } from '@/data/index'
import { cn } from '@/lib/cn'
import type { BuildClass, GamePhase, PrepChecklistKey } from '@/types/boss'
import type { Boss } from '@/types/boss'
import type { StageName } from '@/types/build'
import { useBuildStore } from '@/store/buildStore'
import { useBossStore } from '@/store/bossStore'

const classOptions: BuildClass[] = ['melee', 'ranged', 'magic', 'summoner']
const phaseOptions: Array<GamePhase | 'all'> = ['all', 'pre-hardmode', 'hardmode', 'post-moonlord']

const classConfig: Record<BuildClass, { label: string; icon: React.ElementType; color: string }> = {
  melee: { label: 'Melee', icon: Sword, color: 'text-terra-red' },
  ranged: { label: 'Ranged', icon: Shield, color: 'text-terra-green' },
  magic: { label: 'Magic', icon: Zap, color: 'text-terra-purple' },
  summoner: { label: 'Summoner', icon: Star, color: 'text-terra-gold' },
}

const phaseLabels: Record<GamePhase | 'all', string> = {
  all: 'All Phases',
  'pre-hardmode': 'Pre-Hardmode',
  hardmode: 'Hardmode',
  'post-moonlord': 'Post-Moon Lord',
}

const prepChecklistOrder: PrepChecklistKey[] = ['arena', 'buffs', 'summon', 'mobility']

const prepChecklistLabels: Record<PrepChecklistKey, string> = {
  arena: 'Arena',
  buffs: 'Buffs',
  summon: 'Summon',
  mobility: 'Mobility',
}

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

function buildBossPrepSummary(boss: Boss, selectedClass: BuildClass) {
  const recommendedStage = getRecommendedStageForBoss(boss)
  const selectedGear = boss.recommendedGear.find((gear) => gear.class === selectedClass)
  const primaryWeapon = selectedGear?.weapons[0] ? itemsById.get(selectedGear.weapons[0])?.name ?? `Item #${selectedGear.weapons[0]}` : 'Unknown weapon'
  const primaryArmor = selectedGear?.armor[0] ? itemsById.get(selectedGear.armor[0])?.name ?? `Item #${selectedGear.armor[0]}` : 'Unknown armor'

  return [
    `# ${boss.name} Prep (${selectedClass})`,
    '',
    `Phase: ${phaseLabels[boss.phase]}`,
    `Recommended stage: ${recommendedStage}`,
    `Recommended weapon: ${primaryWeapon}`,
    `Recommended armor: ${primaryArmor}`,
    boss.summonItem ? `Summon item: ${boss.summonItem}` : null,
    boss.summonCondition ? `Summon condition: ${boss.summonCondition}` : null,
    `Arena: ${boss.strategySections?.arena ?? 'No arena guidance recorded.'}`,
    `Mobility: ${boss.strategySections?.mobility ?? 'No mobility guidance recorded.'}`,
    `Buffs: ${boss.strategySections?.buffs ?? 'No buff guidance recorded.'}`,
    `Danger windows: ${boss.strategySections?.dangerWindows ?? 'No danger-window guidance recorded.'}`,
    `Execution: ${boss.strategySections?.execution ?? 'No execution guidance recorded.'}`,
  ].filter(Boolean).join('\n')
}

function isBuildClass(value: string | null): value is BuildClass {
  return value === 'melee' || value === 'ranged' || value === 'magic' || value === 'summoner'
}

function isPhaseFilter(value: string | null): value is GamePhase | 'all' {
  return value === 'all' || value === 'pre-hardmode' || value === 'hardmode' || value === 'post-moonlord'
}

export default function PrepGuide() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const createLoadout = useBuildStore((state) => state.createLoadout)
  const togglePrepItem = useBossStore((state) => state.togglePrepItem)
  const setPrepAllForBoss = useBossStore((state) => state.setPrepAllForBoss)
  const resetPrepForBoss = useBossStore((state) => state.resetPrepForBoss)
  const getPrepChecklist = useBossStore((state) => state.getPrepChecklist)
  const getPrepCompletion = useBossStore((state) => state.getPrepCompletion)
  const [selectedClass, setSelectedClass] = useState<BuildClass>(() => {
    const fromQuery = searchParams.get('class')
    return isBuildClass(fromQuery) ? fromQuery : 'melee'
  })
  const [phaseFilter, setPhaseFilter] = useState<GamePhase | 'all'>(() => {
    const fromQuery = searchParams.get('phase')
    return isPhaseFilter(fromQuery) ? fromQuery : 'all'
  })
  const [clipboardMessage, setClipboardMessage] = useState('')

  const visibleBosses = useMemo(() => {
    return bosses.filter((boss) => {
      if (!boss.strategySections) {
        return false
      }

      if (phaseFilter !== 'all' && boss.phase !== phaseFilter) {
        return false
      }

      return boss.recommendedGear.some((gear) => gear.class === selectedClass)
    })
  }, [phaseFilter, selectedClass])

  useEffect(() => {
    const next = new URLSearchParams()

    if (selectedClass !== 'melee') {
      next.set('class', selectedClass)
    }

    if (phaseFilter !== 'all') {
      next.set('phase', phaseFilter)
    }

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [phaseFilter, searchParams, selectedClass, setSearchParams])

  useEffect(() => {
    if (!clipboardMessage) {
      return
    }

    const timeout = window.setTimeout(() => setClipboardMessage(''), 1800)
    return () => window.clearTimeout(timeout)
  }, [clipboardMessage])

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setClipboardMessage('Link copied')
    } catch {
      setClipboardMessage('Clipboard blocked')
    }
  }

  async function copyFilteredSummary() {
    const sections = visibleBosses.map((boss) => buildBossPrepSummary(boss, selectedClass))

    try {
      await navigator.clipboard.writeText(sections.join('\n\n---\n\n'))
      setClipboardMessage('Prep summary copied')
    } catch {
      setClipboardMessage('Clipboard blocked')
    }
  }

  async function copyBossSummary(boss: Boss) {
    try {
      await navigator.clipboard.writeText(buildBossPrepSummary(boss, selectedClass))
      setClipboardMessage(`${boss.name} summary copied`)
    } catch {
      setClipboardMessage('Clipboard blocked')
    }
  }

  function createLoadoutFromBoss(boss: Boss) {
    const selectedGear = boss.recommendedGear.find((gear) => gear.class === selectedClass)
    if (!selectedGear) {
      return
    }

    const loadoutId = createLoadout({
      name: `${boss.name} ${selectedClass[0].toUpperCase()}${selectedClass.slice(1)}`,
      class: selectedClass,
      slots: {
        armor: [selectedGear.armor[0], selectedGear.armor[1], selectedGear.armor[2]],
        weapon: selectedGear.weapons[0],
        accessories: selectedGear.accessories.slice(0, 5),
      },
    })

    setClipboardMessage(`${boss.name} loadout created`)
    void navigate(`/loadouts?loadout=${encodeURIComponent(loadoutId)}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div className="rounded-2xl border border-terra-border bg-terra-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Boss Prep Guide</p>
            <h1 className="font-pixel text-terra-gold text-lg sm:text-xl">Arena, buffs, and execution by fight</h1>
            <p className="mt-3 max-w-3xl text-sm text-gray-400 leading-relaxed">
              Review prep notes by phase and class without opening each boss drawer individually. This guide is built from the same curated strategy sections that power Boss Tracker, but surfaces the practical pre-fight checklist in one scrollable workflow.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void copyShareLink()}
            className="inline-flex items-center gap-2 rounded-lg border border-terra-border px-3 py-2.5 text-sm text-gray-200 transition-colors hover:border-terra-gold hover:text-terra-gold"
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-terra-border bg-terra-bg p-3">
            <p className="text-xs text-gray-400 mb-2">Class Focus</p>
            <div className="flex flex-wrap gap-2">
              {classOptions.map((buildClass) => {
                const config = classConfig[buildClass]
                const Icon = config.icon

                return (
                  <button
                    key={buildClass}
                    type="button"
                    onClick={() => setSelectedClass(buildClass)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                      selectedClass === buildClass
                        ? 'border-terra-gold bg-terra-panel text-terra-gold'
                        : 'border-terra-border text-gray-300 hover:text-white hover:border-terra-gold'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', config.color)} />
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-terra-border bg-terra-bg p-3">
            <p className="text-xs text-gray-400 mb-2">Phase Filter</p>
            <div className="flex flex-wrap gap-2">
              {phaseOptions.map((phase) => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => setPhaseFilter(phase)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                    phaseFilter === phase
                      ? 'border-terra-gold bg-terra-panel text-terra-gold'
                      : 'border-terra-border text-gray-300 hover:text-white hover:border-terra-gold'
                  )}
                >
                  {phaseLabels[phase]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-gray-500">Filter state is synced to the URL for sharing.</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copyFilteredSummary()}
              className="rounded-lg border border-terra-border px-2.5 py-1.5 text-gray-300 hover:text-white hover:border-terra-gold transition-colors"
            >
              Copy Prep Summary
            </button>
            <p className="text-gray-400">Showing {visibleBosses.length} prep guide{visibleBosses.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        {clipboardMessage ? <p className="mt-2 text-xs text-terra-gold">{clipboardMessage}</p> : null}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {visibleBosses.map((boss) => {
          const selectedGear = boss.recommendedGear.find((gear) => gear.class === selectedClass)
          const primaryWeapon = selectedGear?.weapons[0] ? itemsById.get(selectedGear.weapons[0]) : undefined
          const primaryArmor = selectedGear?.armor[0] ? itemsById.get(selectedGear.armor[0]) : undefined
          const recommendedStage = getRecommendedStageForBoss(boss)
          const checklist = getPrepChecklist(boss.id)
          const checklistProgress = getPrepCompletion(boss.id)

          return (
            <section key={boss.id} className="rounded-xl border border-terra-border bg-terra-surface p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{boss.name}</h2>
                  <p className="text-xs text-gray-500 mt-1">{phaseLabels[boss.phase]}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyBossSummary(boss)}
                    className="inline-flex items-center rounded-lg border border-terra-border px-3 py-2 text-xs text-gray-300 hover:text-white hover:border-terra-gold transition-colors"
                  >
                    Copy Prep
                  </button>
                  <Link
                    to={`/build?class=${selectedClass}&stage=${encodeURIComponent(recommendedStage)}&cap=${encodeURIComponent(recommendedStage)}`}
                    className="inline-flex items-center rounded-lg border border-terra-border px-3 py-2 text-xs text-gray-300 hover:text-white hover:border-terra-gold transition-colors"
                  >
                    Open Build
                  </Link>
                  <button
                    type="button"
                    onClick={() => createLoadoutFromBoss(boss)}
                    className="inline-flex items-center rounded-lg border border-terra-border px-3 py-2 text-xs text-gray-300 hover:text-white hover:border-terra-gold transition-colors"
                  >
                    Create Loadout
                  </button>
                  <Link
                    to={`/bosses/${boss.id}?class=${selectedClass}`}
                    className="inline-flex items-center rounded-lg border border-terra-border px-3 py-2 text-xs text-terra-sky hover:text-terra-gold hover:border-terra-gold transition-colors"
                  >
                    Open Boss Guide
                  </Link>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-terra-border bg-terra-bg p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-300">Readiness Checklist</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500">{checklistProgress.completed}/{checklistProgress.total}</p>
                    <button
                      type="button"
                      onClick={() => setPrepAllForBoss(boss.id)}
                      className="text-xs text-terra-green hover:text-green-300 transition-colors"
                    >
                      Mark Ready
                    </button>
                    <button
                      type="button"
                      onClick={() => resetPrepForBoss(boss.id)}
                      className="text-xs text-gray-500 hover:text-terra-red transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {prepChecklistOrder.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePrepItem(boss.id, key)}
                      className={cn(
                        'rounded border px-2 py-1.5 text-xs font-semibold transition-colors',
                        checklist[key]
                          ? 'border-terra-green bg-terra-panel text-terra-green'
                          : 'border-terra-border text-gray-300 hover:border-terra-gold hover:text-white'
                      )}
                    >
                      {prepChecklistLabels[key]}
                    </button>
                  ))}
                </div>
              </div>

              {selectedGear ? (
                <div className="mt-4 rounded-lg border border-terra-border bg-terra-bg px-3 py-3 text-sm text-gray-300">
                  <p>
                    Recommended weapon: <span className="text-white">{primaryWeapon?.name ?? 'Unknown weapon'}</span>{' '}
                    {primaryWeapon ? (
                      <Link
                        to={`/items?selected=${primaryWeapon.id}`}
                        className="text-terra-sky hover:text-terra-gold transition-colors"
                      >
                        Open in Item Lookup
                      </Link>
                    ) : null}
                  </p>
                  <p className="mt-1">
                    Recommended armor: <span className="text-white">{primaryArmor?.name ?? 'Unknown armor'}</span>{' '}
                    {primaryArmor ? (
                      <Link
                        to={`/items?selected=${primaryArmor.id}`}
                        className="text-terra-sky hover:text-terra-gold transition-colors"
                      >
                        Open in Item Lookup
                      </Link>
                    ) : null}
                  </p>
                  <p className="mt-1">
                    Recommended stage:{' '}
                    <Link
                      to={`/build?class=${selectedClass}&stage=${encodeURIComponent(recommendedStage)}&cap=${encodeURIComponent(recommendedStage)}`}
                      className="text-terra-sky hover:text-terra-gold transition-colors"
                    >
                      {recommendedStage}
                    </Link>
                  </p>
                </div>
              ) : null}

              {(boss.summonItem || boss.summonCondition) ? (
                <div className="mt-4 rounded-lg border border-terra-border bg-terra-bg px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-500 mb-1">Summon</p>
                  {boss.summonItem ? <p className="text-sm text-gray-300 leading-relaxed">Item: {boss.summonItem}</p> : null}
                  {boss.summonCondition ? <p className="text-sm text-gray-300 leading-relaxed mt-1">Condition: {boss.summonCondition}</p> : null}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3">
                <div className="rounded-lg border border-terra-border bg-terra-bg px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-500 mb-1">Arena</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{boss.strategySections?.arena}</p>
                </div>
                <div className="rounded-lg border border-terra-border bg-terra-bg px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-500 mb-1">Mobility</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{boss.strategySections?.mobility}</p>
                </div>
                <div className="rounded-lg border border-terra-border bg-terra-bg px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-500 mb-1">Buffs</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{boss.strategySections?.buffs}</p>
                </div>
                <div className="rounded-lg border border-terra-border bg-terra-bg px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-500 mb-1">Danger Windows</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{boss.strategySections?.dangerWindows}</p>
                </div>
                <div className="rounded-lg border border-terra-border bg-terra-bg px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-gray-500 mb-1">Execution</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{boss.strategySections?.execution}</p>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}