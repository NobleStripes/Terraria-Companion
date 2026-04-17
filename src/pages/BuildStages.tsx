import { useState } from 'react'
import { Sword, Shield, Zap, Star } from 'lucide-react'
import type { BuildClass } from '@/types/boss'
import type { Difficulty, StageName, WorldEvil } from '@/types/build'
import { cn } from '@/lib/cn'
import {
  difficultyOptions,
  getFilteredStageBuilds,
  progressionCaps,
  worldEvilOptions,
} from '@/data/builds'

const classes: BuildClass[] = ['melee', 'ranged', 'magic', 'summoner']

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

export default function BuildStages() {
  const [selectedClass, setSelectedClass] = useState<BuildClass>('melee')
  const [worldEvil, setWorldEvil] = useState<WorldEvil>('corruption')
  const [difficulty, setDifficulty] = useState<Difficulty>('classic')
  const [progressionCap, setProgressionCap] = useState<StageName>('Endgame')
  const { label, icon: Icon, color, description } = classConfig[selectedClass]
  const visibleBuilds = getFilteredStageBuilds(selectedClass, {
    worldEvil,
    difficulty,
    progressionCap,
  })

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

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {visibleBuilds.map((entry) => (
            <div key={entry.stage} className="bg-terra-bg border border-terra-border rounded-lg p-3">
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
              <p className="text-sm text-gray-200 mb-2">{entry.armor}</p>
              <p className="text-xs text-gray-400 mb-1">Weapon</p>
              <p className="text-sm text-gray-200 mb-2">{entry.weapon}</p>
              <p className="text-xs text-gray-400 mb-1">Accessories</p>
              <p className="text-sm text-gray-200 mb-2">{entry.accessories.join(' • ')}</p>

              {entry.why.length > 0 ? (
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
