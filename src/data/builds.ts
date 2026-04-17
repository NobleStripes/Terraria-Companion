import type { BuildClass } from '@/types/boss'
import type {
  BuildFilters,
  Difficulty,
  ResolvedStageRecommendation,
  StageAdjustmentRule,
  StageName,
  StageRecommendation,
  StagedBuildsByClass,
  WorldEvil,
} from '@/types/build'
import { stageOrder } from '@/types/build'

export const progressionCaps: Array<{ label: string; stage: StageName }> = [
  { label: 'Early Game', stage: 'Early Game' },
  { label: 'Pre-Hardmode', stage: 'Pre-Hardmode' },
  { label: 'Early Hardmode', stage: 'Early Hardmode' },
  { label: 'Endgame', stage: 'Endgame' },
]

export const worldEvilOptions: WorldEvil[] = ['corruption', 'crimson']
export const difficultyOptions: Difficulty[] = ['classic', 'expert', 'master']

export const stagedBuilds: StagedBuildsByClass = {
  melee: [
    {
      stage: 'Early Game',
      armor: 'Platinum Armor',
      weapon: 'Platinum Broadsword',
      accessories: ['Hermes Boots', 'Cloud in a Bottle', 'Band of Regeneration'],
      note: 'Prioritize movement and survivability while clearing pre-boss progression.',
      why: ['Fast movement keeps contact damage low during exploration.'],
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Molten Armor',
      weapon: "Night's Edge",
      accessories: ['Obsidian Shield', 'Spectre Boots', 'Worm Scarf'],
      note: 'A reliable setup for Wall of Flesh and pre-Hardmode events.',
      why: ['Knockback immunity and boots make Hellbridge combat much safer.'],
    },
    {
      stage: 'Early Hardmode',
      armor: 'Titanium Armor',
      weapon: 'Excalibur',
      accessories: ['Warrior Emblem', 'Lightning Boots', 'Worm Scarf'],
      note: 'Stabilize against mech bosses before chasing late Hardmode upgrades.',
      why: ['Early emblem scaling gives consistent boss kill-time improvements.'],
    },
    {
      stage: 'Endgame',
      armor: 'Solar Flare Armor',
      weapon: 'Zenith',
      accessories: ['Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
      note: 'Final progression build tuned for Moon Lord farming and endgame content.',
      why: ['Balanced survivability and movement supports repeat farming consistency.'],
    },
  ],
  ranged: [
    {
      stage: 'Early Game',
      armor: 'Gold Armor',
      weapon: 'Platinum Bow',
      accessories: ['Hermes Boots', 'Lucky Horseshoe', 'Cloud in a Bottle'],
      note: 'Strong early kiting setup while building ammo economy.',
      why: ['Vertical mobility lets you safely kite early ground threats.'],
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Necro Armor',
      weapon: 'Minishark',
      accessories: ['Shark Tooth Necklace', 'Spectre Boots', 'Obsidian Shield'],
      note: 'Great pre-Hardmode ranged baseline for bosses and invasions.',
      why: ['High hit-rate weapon smooths out inconsistent early ammo loadouts.'],
    },
    {
      stage: 'Early Hardmode',
      armor: 'Hallowed Armor',
      weapon: 'Daedalus Stormbow',
      accessories: ['Ranger Emblem', 'Lightning Boots', 'Wings'],
      note: 'A classic mech-boss focused ranged power spike.',
      why: ['Strong sky-hit coverage makes destroyer-style fights much easier.'],
    },
    {
      stage: 'Endgame',
      armor: 'Vortex Armor',
      weapon: 'Phantasm',
      accessories: ['Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
      note: 'High DPS endgame setup with excellent mobility and survivability.',
      why: ['High sustained ranged DPS keeps pressure up during mobile boss phases.'],
    },
  ],
  magic: [
    {
      stage: 'Early Game',
      armor: 'Jungle Armor',
      weapon: 'Space Gun',
      accessories: ['Band of Regeneration', 'Cloud in a Bottle', 'Hermes Boots'],
      note: 'Early mana-efficient setup to unlock smooth magic progression.',
      why: ['Low-friction mana usage allows longer fights without potion drain.'],
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Jungle Armor',
      weapon: 'Water Bolt',
      accessories: ['Mana Flower', 'Spectre Boots', 'Obsidian Shield'],
      note: 'Reliable pre-Hardmode control and boss pressure with low risk.',
      why: ['Piercing control helps clear adds while still pressuring bosses.'],
    },
    {
      stage: 'Early Hardmode',
      armor: 'Titanium Armor',
      weapon: 'Golden Shower',
      accessories: ['Sorcerer Emblem', 'Lightning Boots', 'Wings'],
      note: 'Excellent support and burst profile for mech boss progression.',
      why: ['Defense-shred utility amplifies follow-up spell damage.'],
    },
    {
      stage: 'Endgame',
      armor: 'Nebula Armor',
      weapon: 'Last Prism',
      accessories: ['Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
      note: 'Top-tier magic burst for pillar and Moon Lord cycles.',
      why: ['High beam burst shortens dangerous final-phase windows.'],
    },
  ],
  summoner: [
    {
      stage: 'Early Game',
      armor: 'Bee Armor',
      weapon: 'Imp Staff',
      accessories: ['Hermes Boots', 'Cloud in a Bottle', 'Band of Regeneration'],
      note: 'Starter summon route focused on minion uptime and mobility.',
      why: ['Mobility keeps minion AI active while avoiding direct trades.'],
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Bee Armor',
      weapon: 'Imp Staff',
      accessories: ['Feral Claws', 'Spectre Boots', 'Obsidian Shield'],
      note: 'Comfortable pre-Hardmode summon progression before spider gear.',
      why: ['Whip support adds meaningful DPS without dropping safety.'],
    },
    {
      stage: 'Early Hardmode',
      armor: 'Spider Armor',
      weapon: 'Spider Staff',
      accessories: ['Summoner Emblem', 'Lightning Boots', 'Wings'],
      note: 'Core summoner spike for early Hardmode and mechs.',
      why: ['Extra minion scaling is crucial before late-hardmode survivability tools.'],
    },
    {
      stage: 'Endgame',
      armor: 'Stardust Armor',
      weapon: 'Stardust Dragon Staff',
      accessories: ['Papyrus Scarab', 'Necromantic Scroll', 'Fishron Wings'],
      note: 'Endgame minion scaling focused on sustained boss pressure.',
      why: ['Summon modifiers stack into strong long-fight DPS consistency.'],
    },
  ],
}

const worldEvilRules: Record<WorldEvil, StageAdjustmentRule[]> = {
  corruption: [
    {
      replaceAccessories: {
        'Brain of Confusion': 'Worm Scarf',
      },
      replaceWeapons: {
        'Golden Shower': 'Cursed Flames',
      },
      adjustmentLabel: 'Corruption variant',
      addWhyBullets: ['Corruption-only drops shift defensive and magic support options.'],
    },
  ],
  crimson: [
    {
      replaceAccessories: {
        'Worm Scarf': 'Brain of Confusion',
      },
      adjustmentLabel: 'Crimson variant',
      addWhyBullets: ['Crimson variant favors dodge-based defense from Brain of Confusion.'],
    },
  ],
}

const expertBaselineRules: StageAdjustmentRule[] = [
  {
    applyIf: {
      excludeStages: ['Endgame'],
    },
    addAccessoriesAtStart: ['Shield of Cthulhu'],
    limitAccessories: 3,
    adjustmentLabel: 'Expert mobility swap',
    addWhyBullets: ['Pre-endgame fights assume dash i-frames for safer aggression.'],
  },
  {
    appendNote: 'Expert+ mobility and invuln timing are assumed.',
    adjustmentLabel: 'Expert pacing',
  },
]

const difficultyRules: Record<Difficulty, StageAdjustmentRule[]> = {
  classic: [],
  expert: expertBaselineRules,
  master: [
    ...expertBaselineRules,
    {
      applyIf: {
        stages: ['Endgame'],
      },
      addAccessoriesAtStart: ['Master Ninja Gear'],
      adjustmentLabel: 'Master survivability',
      addWhyBullets: ['Endgame master encounters reward dodge-chain and reposition uptime.'],
    },
    {
      appendNote: 'Master Mode defense checks are stricter; prioritize dodging uptime.',
      adjustmentLabel: 'Master tuning',
    },
  ],
}

function ruleApplies(entry: StageRecommendation, rule: StageAdjustmentRule): boolean {
  if (!rule.applyIf) {
    return true
  }

  const { stages, excludeStages } = rule.applyIf
  if (stages && !stages.includes(entry.stage)) {
    return false
  }

  if (excludeStages && excludeStages.includes(entry.stage)) {
    return false
  }

  return true
}

function applyRules(entry: StageRecommendation, rules: StageAdjustmentRule[]): ResolvedStageRecommendation {
  const next: ResolvedStageRecommendation = {
    ...entry,
    accessories: [...entry.accessories],
    why: [...(entry.why ?? [])],
    adjustments: [],
  }

  for (const rule of rules) {
    if (!ruleApplies(next, rule)) {
      continue
    }

    if (rule.replaceAccessories) {
      next.accessories = next.accessories.map((acc) => rule.replaceAccessories?.[acc] ?? acc)
    }

    if (rule.replaceWeapons && rule.replaceWeapons[next.weapon]) {
      next.weapon = rule.replaceWeapons[next.weapon]
    }

    if (rule.addAccessoriesAtStart) {
      for (let i = rule.addAccessoriesAtStart.length - 1; i >= 0; i -= 1) {
        const accessory = rule.addAccessoriesAtStart[i]
        if (!next.accessories.includes(accessory)) {
          next.accessories.unshift(accessory)
        }
      }
    }

    if (typeof rule.limitAccessories === 'number') {
      next.accessories = next.accessories.slice(0, rule.limitAccessories)
    }

    if (rule.appendNote) {
      next.note = `${next.note} ${rule.appendNote}`
    }

    if (rule.addWhyBullets) {
      for (const bullet of rule.addWhyBullets) {
        if (!next.why.includes(bullet)) {
          next.why.push(bullet)
        }
      }
    }

    if (rule.adjustmentLabel && !next.adjustments.includes(rule.adjustmentLabel)) {
      next.adjustments.push(rule.adjustmentLabel)
    }
  }

  return next
}

export function getFilteredStageBuilds(buildClass: BuildClass, filters: BuildFilters): ResolvedStageRecommendation[] {
  const maxStageIndex = stageOrder.indexOf(filters.progressionCap)
  const baseBuilds = stagedBuilds[buildClass]

  if (maxStageIndex === -1) {
    return baseBuilds.map((entry) => ({
      ...entry,
      accessories: [...entry.accessories],
      why: [...(entry.why ?? [])],
      adjustments: [],
    }))
  }

  const activeRules = [...worldEvilRules[filters.worldEvil], ...difficultyRules[filters.difficulty]]

  return baseBuilds
    .filter((entry) => stageOrder.indexOf(entry.stage) <= maxStageIndex)
    .map((entry) => applyRules(entry, activeRules))
}
