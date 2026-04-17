import { useState } from 'react'
import { Sword, Shield, Zap, Star } from 'lucide-react'
import type { BuildClass } from '@/types/boss'
import { cn } from '@/lib/cn'

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

interface StageRecommendation {
  stage: string
  armor: string
  weapon: string
  accessories: string[]
  note: string
}

const stagedBuilds: Record<BuildClass, StageRecommendation[]> = {
  melee: [
    {
      stage: 'Early Game',
      armor: 'Platinum Armor',
      weapon: 'Platinum Broadsword',
      accessories: ['Hermes Boots', 'Cloud in a Bottle', 'Band of Regeneration'],
      note: 'Prioritize movement and survivability while clearing pre-boss progression.',
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Molten Armor',
      weapon: "Night's Edge",
      accessories: ['Obsidian Shield', 'Spectre Boots', 'Worm Scarf'],
      note: 'A reliable setup for Wall of Flesh and pre-Hardmode events.',
    },
    {
      stage: 'Early Hardmode',
      armor: 'Titanium Armor',
      weapon: 'Excalibur',
      accessories: ['Warrior Emblem', 'Lightning Boots', 'Worm Scarf'],
      note: 'Stabilize against mech bosses before chasing late Hardmode upgrades.',
    },
    {
      stage: 'Endgame',
      armor: 'Solar Flare Armor',
      weapon: 'Zenith',
      accessories: ['Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
      note: 'Final progression build tuned for Moon Lord farming and endgame content.',
    },
  ],
  ranged: [
    {
      stage: 'Early Game',
      armor: 'Gold Armor',
      weapon: 'Platinum Bow',
      accessories: ['Hermes Boots', 'Lucky Horseshoe', 'Cloud in a Bottle'],
      note: 'Strong early kiting setup while building ammo economy.',
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Necro Armor',
      weapon: 'Minishark',
      accessories: ['Shark Tooth Necklace', 'Spectre Boots', 'Obsidian Shield'],
      note: 'Great pre-Hardmode ranged baseline for bosses and invasions.',
    },
    {
      stage: 'Early Hardmode',
      armor: 'Hallowed Armor',
      weapon: 'Daedalus Stormbow',
      accessories: ['Ranger Emblem', 'Lightning Boots', 'Wings'],
      note: 'A classic mech-boss focused ranged power spike.',
    },
    {
      stage: 'Endgame',
      armor: 'Vortex Armor',
      weapon: 'Phantasm',
      accessories: ['Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
      note: 'High DPS endgame setup with excellent mobility and survivability.',
    },
  ],
  magic: [
    {
      stage: 'Early Game',
      armor: 'Jungle Armor',
      weapon: 'Space Gun',
      accessories: ['Band of Regeneration', 'Cloud in a Bottle', 'Hermes Boots'],
      note: 'Early mana-efficient setup to unlock smooth magic progression.',
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Jungle Armor',
      weapon: 'Water Bolt',
      accessories: ['Mana Flower', 'Spectre Boots', 'Obsidian Shield'],
      note: 'Reliable pre-Hardmode control and boss pressure with low risk.',
    },
    {
      stage: 'Early Hardmode',
      armor: 'Titanium Armor',
      weapon: 'Golden Shower',
      accessories: ['Sorcerer Emblem', 'Lightning Boots', 'Wings'],
      note: 'Excellent support and burst profile for mech boss progression.',
    },
    {
      stage: 'Endgame',
      armor: 'Nebula Armor',
      weapon: 'Last Prism',
      accessories: ['Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
      note: 'Top-tier magic burst for pillar and Moon Lord cycles.',
    },
  ],
  summoner: [
    {
      stage: 'Early Game',
      armor: 'Bee Armor',
      weapon: 'Imp Staff',
      accessories: ['Hermes Boots', 'Cloud in a Bottle', 'Band of Regeneration'],
      note: 'Starter summon route focused on minion uptime and mobility.',
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Bee Armor',
      weapon: 'Imp Staff',
      accessories: ['Feral Claws', 'Spectre Boots', 'Obsidian Shield'],
      note: 'Comfortable pre-Hardmode summon progression before spider gear.',
    },
    {
      stage: 'Early Hardmode',
      armor: 'Spider Armor',
      weapon: 'Spider Staff',
      accessories: ['Summoner Emblem', 'Lightning Boots', 'Wings'],
      note: 'Core summoner spike for early Hardmode and mechs.',
    },
    {
      stage: 'Endgame',
      armor: 'Stardust Armor',
      weapon: 'Stardust Dragon Staff',
      accessories: ['Papyrus Scarab', 'Necromantic Scroll', 'Fishron Wings'],
      note: 'Endgame minion scaling focused on sustained boss pressure.',
    },
  ],
}
export default function BuildStages() {
  const [selectedClass, setSelectedClass] = useState<BuildClass>('melee')
  const { label, icon: Icon, color, description } = classConfig[selectedClass]

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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {stagedBuilds[selectedClass].map((entry) => (
            <div key={entry.stage} className="bg-terra-bg border border-terra-border rounded-lg p-3">
              <h3 className="text-sm font-semibold text-white mb-2">{entry.stage}</h3>
              <p className="text-xs text-gray-400 mb-1">Armor</p>
              <p className="text-sm text-gray-200 mb-2">{entry.armor}</p>
              <p className="text-xs text-gray-400 mb-1">Weapon</p>
              <p className="text-sm text-gray-200 mb-2">{entry.weapon}</p>
              <p className="text-xs text-gray-400 mb-1">Accessories</p>
              <p className="text-sm text-gray-200 mb-2">{entry.accessories.join(' • ')}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{entry.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
