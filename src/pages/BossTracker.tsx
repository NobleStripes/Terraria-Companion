import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Circle, ChevronDown, ChevronUp, RotateCcw, Shield, Sword, Zap, Star } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useBosses } from '@/hooks/useBosses'
import { cn } from '@/lib/cn'
import type { Boss, BuildClass, GamePhase } from '@/types/boss'

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

function GearTab({ boss, selectedClass, onClassChange }: { boss: Boss; selectedClass: BuildClass; onClassChange: (c: BuildClass) => void }) {
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
              <div>
                <h5 className="text-terra-gold text-xs font-semibold mb-2 uppercase">Armor</h5>
                <ul className="space-y-1">
                  {primary?.armor.map((a) => <li key={a} className="text-gray-300">• {a}</li>)}
                </ul>
              </div>
              <div>
                <h5 className="text-terra-gold text-xs font-semibold mb-2 uppercase">Weapons</h5>
                <ul className="space-y-1">
                  {primary?.weapons.map((w) => <li key={w} className="text-gray-300">• {w}</li>)}
                </ul>
              </div>
              <div>
                <h5 className="text-terra-gold text-xs font-semibold mb-2 uppercase">Accessories</h5>
                <ul className="space-y-1">
                  {primary?.accessories.map((a) => <li key={a} className="text-gray-300">• {a}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {hasAlternate && (
            <div>
              <h4 className="text-terra-sky text-xs font-pixel mb-2">Alternate Gear</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h5 className="text-terra-sky text-xs font-semibold mb-2 uppercase">Armor</h5>
                  <ul className="space-y-1">
                    {alternate?.armor.map((a) => <li key={a} className="text-gray-300">• {a}</li>)}
                  </ul>
                </div>
                <div>
                  <h5 className="text-terra-sky text-xs font-semibold mb-2 uppercase">Weapons</h5>
                  <ul className="space-y-1">
                    {alternate?.weapons.map((w) => <li key={w} className="text-gray-300">• {w}</li>)}
                  </ul>
                </div>
                <div>
                  <h5 className="text-terra-sky text-xs font-semibold mb-2 uppercase">Accessories</h5>
                  <ul className="space-y-1">
                    {alternate?.accessories.map((a) => <li key={a} className="text-gray-300">• {a}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Tip: Primary recommendations are listed first; additional options appear under Alternate Gear.
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No gear data for this class.</p>
      )}
    </div>
  )
}

type DrawerTab = 'overview' | 'gear' | 'tips'

function BossDrawer({ boss, onClose }: { boss: Boss; onClose: () => void }) {
  const [tab, setTab] = useState<DrawerTab>('overview')
  const [gearClass, setGearClass] = useState<BuildClass>('melee')
  const tabs: DrawerTab[] = ['overview', 'gear', 'tips']

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full max-w-lg bg-terra-surface border-l border-terra-border overflow-y-auto flex flex-col">
        <div className="p-5 border-b border-terra-border">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel text-terra-gold text-xs">{boss.name}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
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
                'flex-1 py-2.5 text-xs font-semibold capitalize transition-colors',
                tab === t ? 'text-terra-gold border-b-2 border-terra-gold' : 'text-gray-400 hover:text-white'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5 flex-1">
          {tab === 'overview' && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm leading-relaxed">{boss.strategy}</p>
              {boss.drops.length > 0 && (
                <div>
                  <h3 className="text-terra-gold text-xs font-pixel mb-2">Notable Drops</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {boss.drops.map((d) => (
                      <span key={d} className="bg-terra-bg border border-terra-border rounded px-2 py-1 text-xs text-gray-300">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'gear' && (
            <GearTab boss={boss} selectedClass={gearClass} onClassChange={setGearClass} />
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

function BossCard({ boss, isDefeated, onToggle, onOpen }: {
  boss: Boss
  isDefeated: boolean
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
          className="shrink-0 text-terra-green hover:scale-110 transition-transform"
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
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpen}
            className="text-xs text-terra-sky hover:text-terra-gold transition-colors px-2 py-1 border border-terra-border rounded hover:border-terra-gold"
          >
            Guide
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-gray-400 hover:text-white transition-colors"
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
  const { bossId } = useParams()
  const navigate = useNavigate()
  const { grouped, totalCount, defeatedCount, toggleBoss, resetAll, isDefeated } = useBosses()
  const [openBoss, setOpenBoss] = useState<Boss | undefined>()
  const [confirmReset, setConfirmReset] = useState(false)

  const phases: GamePhase[] = ['pre-hardmode', 'hardmode', 'post-moonlord']

  useEffect(() => {
    if (bossId) {
      const found = Object.values(grouped).flat().find((b) => b.id === bossId)
      if (found) setOpenBoss(found)
    }
  }, [bossId, grouped])

  function openGuide(boss: Boss) {
    setOpenBoss(boss)
    navigate(`/bosses/${boss.id}`, { replace: true })
  }

  function closeGuide() {
    setOpenBoss(undefined)
    navigate('/bosses', { replace: true })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-pixel text-terra-gold text-sm">Boss Tracker</h1>
        <button
          onClick={() => setConfirmReset(true)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-terra-red transition-colors border border-terra-border hover:border-terra-red rounded px-2.5 py-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>

      <ProgressBar value={defeatedCount} max={totalCount} className="mb-8" />

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
                {phaseBosses.map((boss) => (
                  <BossCard
                    key={boss.id}
                    boss={boss}
                    isDefeated={isDefeated(boss.id)}
                    onToggle={() => toggleBoss(boss.id)}
                    onOpen={() => openGuide(boss)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {openBoss && <BossDrawer boss={openBoss} onClose={closeGuide} />}

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-terra-surface border border-terra-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-pixel text-terra-red text-xs mb-4">Reset Progress?</h3>
            <p className="text-gray-300 text-sm mb-6">
              This will clear all defeated boss progress. This cannot be undone.
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
