import fs from 'node:fs'
import path from 'node:path'

const itemsPath = path.resolve(process.cwd(), 'src/data/items.json')
const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'))

const tierRank = {
  'early-game': 0,
  'pre-hardmode': 1,
  'early-hardmode': 2,
  endgame: 3,
}

const stageRank = {
  'Early Game': 0,
  'Pre-Hardmode': 1,
  'Early Hardmode': 2,
  Endgame: 3,
}

const itemTierByName = new Map(items.map((item) => [item.name.toLowerCase(), item.progressionTier]))

const recommendations = {
  melee: {
    'Early Game': ['Platinum Armor', 'Platinum Broadsword', 'Hermes Boots', 'Cloud in a Bottle', 'Band of Regeneration'],
    'Pre-Hardmode': ['Molten Armor', "Night's Edge", 'Obsidian Shield', 'Spectre Boots', 'Worm Scarf'],
    'Early Hardmode': ['Titanium Armor', 'Excalibur', 'Warrior Emblem', 'Lightning Boots', 'Worm Scarf'],
    Endgame: ['Solar Flare Armor', 'Zenith', 'Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
  },
  ranged: {
    'Early Game': ['Gold Armor', 'Platinum Bow', 'Hermes Boots', 'Lucky Horseshoe', 'Cloud in a Bottle'],
    'Pre-Hardmode': ['Necro Armor', 'Minishark', 'Shark Tooth Necklace', 'Spectre Boots', 'Obsidian Shield'],
    'Early Hardmode': ['Hallowed Armor', 'Daedalus Stormbow', 'Ranger Emblem', 'Lightning Boots', 'Wings'],
    Endgame: ['Vortex Armor', 'Phantasm', 'Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
  },
  magic: {
    'Early Game': ['Jungle Armor', 'Space Gun', 'Band of Regeneration', 'Cloud in a Bottle', 'Hermes Boots'],
    'Pre-Hardmode': ['Jungle Armor', 'Water Bolt', 'Mana Flower', 'Spectre Boots', 'Obsidian Shield'],
    'Early Hardmode': ['Titanium Armor', 'Golden Shower', 'Sorcerer Emblem', 'Lightning Boots', 'Wings'],
    Endgame: ['Nebula Armor', 'Last Prism', 'Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
  },
  summoner: {
    'Early Game': ['Bee Armor', 'Imp Staff', 'Hermes Boots', 'Cloud in a Bottle', 'Band of Regeneration'],
    'Pre-Hardmode': ['Bee Armor', 'Imp Staff', 'Feral Claws', 'Spectre Boots', 'Obsidian Shield'],
    'Early Hardmode': ['Spider Armor', 'Spider Staff', 'Summoner Emblem', 'Lightning Boots', 'Wings'],
    Endgame: ['Stardust Armor', 'Stardust Dragon Staff', 'Papyrus Scarab', 'Necromantic Scroll', 'Fishron Wings'],
  },
}

const errors = []
const warnings = []

for (const [buildClass, byStage] of Object.entries(recommendations)) {
  for (const [stage, names] of Object.entries(byStage)) {
    for (const name of names) {
      const tier = itemTierByName.get(name.toLowerCase())
      if (!tier) {
        warnings.push(`${buildClass} ${stage}: missing item '${name}' in item catalog`)
        continue
      }

      if (tierRank[tier] > stageRank[stage]) {
        errors.push(`${buildClass} ${stage}: item '${name}' tier '${tier}' exceeds stage`) 
      }
    }
  }
}

if (errors.length > 0) {
  console.error('\nBuild recommendation validation failed:\n')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

if (warnings.length > 0) {
  console.warn('\nBuild recommendation warnings:\n')
  for (const warning of warnings) {
    console.warn(`- ${warning}`)
  }
}

console.log('Build recommendation validation passed.')
