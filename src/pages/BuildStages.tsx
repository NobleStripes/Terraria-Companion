import { useState } from 'react'
import { Plus, Trash2, Copy, Sword, Shield, Zap, Star, Edit2, Check } from 'lucide-react'
import { useBuildStore, defaultSlots } from '@/store/buildStore'
import type { Loadout } from '@/store/buildStore'
import type { BuildClass } from '@/types/boss'
import type { Item, ItemType } from '@/types/item'
import { SearchBar } from '@/components/ui/SearchBar'
import { useItemSearch } from '@/hooks/useItemSearch'
import { cn } from '@/lib/cn'
import { getRarityBorderClass } from '@/components/ui/Badge'
import { itemsById } from '@/data/index'

const classes: BuildClass[] = ['melee', 'ranged', 'magic', 'summoner']

const classConfig: Record<BuildClass, { label: string; icon: React.ElementType; color: string }> = {
  melee: { label: 'Melee', icon: Sword, color: 'text-terra-red' },
  ranged: { label: 'Ranged', icon: Shield, color: 'text-terra-green' },
  magic: { label: 'Magic', icon: Zap, color: 'text-terra-purple' },
  summoner: { label: 'Summoner', icon: Star, color: 'text-terra-gold' },
}

const slotTypes: Record<string, ItemType[]> = {
  armor: ['armor'],
  weapon: ['weapon'],
  accessory: ['accessory'],
}

interface StageRecommendation {
  stage: string
  armor: string
  weapon: string
  accessories: string[]
}

const stagedBuilds: Record<BuildClass, StageRecommendation[]> = {
  melee: [
    {
      stage: 'Early Game',
      armor: 'Platinum Armor',
      weapon: 'Platinum Broadsword',
      accessories: ['Hermes Boots', 'Cloud in a Bottle', 'Band of Regeneration'],
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Molten Armor',
      weapon: "Night's Edge",
      accessories: ['Obsidian Shield', 'Spectre Boots', 'Worm Scarf'],
    },
    {
      stage: 'Early Hardmode',
      armor: 'Titanium Armor',
      weapon: 'Excalibur',
      accessories: ['Warrior Emblem', 'Lightning Boots', 'Worm Scarf'],
    },
    {
      stage: 'Endgame',
      armor: 'Solar Flare Armor',
      weapon: 'Zenith',
      accessories: ['Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
    },
  ],
  ranged: [
    {
      stage: 'Early Game',
      armor: 'Gold Armor',
      weapon: 'Platinum Bow',
      accessories: ['Hermes Boots', 'Lucky Horseshoe', 'Cloud in a Bottle'],
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Necro Armor',
      weapon: 'Minishark',
      accessories: ['Shark Tooth Necklace', 'Spectre Boots', 'Obsidian Shield'],
    },
    {
      stage: 'Early Hardmode',
      armor: 'Hallowed Armor',
      weapon: 'Daedalus Stormbow',
      accessories: ['Ranger Emblem', 'Lightning Boots', 'Wings'],
    },
    {
      stage: 'Endgame',
      armor: 'Vortex Armor',
      weapon: 'Phantasm',
      accessories: ['Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
    },
  ],
  magic: [
    {
      stage: 'Early Game',
      armor: 'Jungle Armor',
      weapon: 'Space Gun',
      accessories: ['Band of Regeneration', 'Cloud in a Bottle', 'Hermes Boots'],
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Jungle Armor',
      weapon: 'Water Bolt',
      accessories: ['Mana Flower', 'Spectre Boots', 'Obsidian Shield'],
    },
    {
      stage: 'Early Hardmode',
      armor: 'Titanium Armor',
      weapon: 'Golden Shower',
      accessories: ['Sorcerer Emblem', 'Lightning Boots', 'Wings'],
    },
    {
      stage: 'Endgame',
      armor: 'Nebula Armor',
      weapon: 'Last Prism',
      accessories: ['Celestial Shell', 'Ankh Shield', 'Fishron Wings'],
    },
  ],
  summoner: [
    {
      stage: 'Early Game',
      armor: 'Bee Armor',
      weapon: 'Imp Staff',
      accessories: ['Hermes Boots', 'Cloud in a Bottle', 'Band of Regeneration'],
    },
    {
      stage: 'Pre-Hardmode',
      armor: 'Bee Armor',
      weapon: 'Imp Staff',
      accessories: ['Feral Claws', 'Spectre Boots', 'Obsidian Shield'],
    },
    {
      stage: 'Early Hardmode',
      armor: 'Spider Armor',
      weapon: 'Spider Staff',
      accessories: ['Summoner Emblem', 'Lightning Boots', 'Wings'],
    },
    {
      stage: 'Endgame',
      armor: 'Stardust Armor',
      weapon: 'Stardust Dragon Staff',
      accessories: ['Papyrus Scarab', 'Necromantic Scroll', 'Fishron Wings'],
    },
  ],
}

interface ItemPickerModalProps {
  label: string
  types: ItemType[]
  currentName?: string
  onSelect: (item: Item) => void
  onClear: () => void
  onClose: () => void
}

function ItemPickerModal({ label, types, currentName, onSelect, onClear, onClose }: ItemPickerModalProps) {
  const [query, setQuery] = useState('')
  const results = useItemSearch(query, { types })
  const displayItems = query.trim().length >= 2
    ? results.map((r) => r.item)
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-terra-surface border border-terra-border rounded-xl w-full max-w-md mx-4 flex flex-col max-h-[70vh]">
        <div className="p-4 border-b border-terra-border flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">{label}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="p-4 border-b border-terra-border">
          <SearchBar value={query} onChange={setQuery} placeholder="Search…" autoFocus />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {currentName && (
            <button
              onClick={onClear}
              className="w-full text-left px-3 py-2 rounded text-terra-red text-sm hover:bg-terra-panel transition-colors"
            >
              ✕ Clear slot
            </button>
          )}
          {query.trim().length < 2 && (
            <p className="text-gray-500 text-sm text-center py-4">Type to search items</p>
          )}
          {displayItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onSelect(item); onClose() }}
              className={cn(
                'w-full text-left px-3 py-2 rounded border transition-colors',
                'bg-terra-bg border-terra-border hover:border-terra-gold hover:bg-terra-panel',
              )}
            >
              <span className="text-white text-sm font-semibold">{item.name}</span>
              <span className={cn('ml-2 text-xs', getRarityBorderClass(item.rarity))}>{item.rarity}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface SlotButtonProps {
  label: string
  value?: string
  types: ItemType[]
  onSet: (item: Item) => void
  onClear: () => void
}

function SlotButton({ label, value, types, onSet, onClear }: SlotButtonProps) {
  const [open, setOpen] = useState(false)
  const item = value ? Array.from(itemsById.values()).find((i) => i.name === value) : undefined

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-full text-left px-3 py-2 rounded border text-sm transition-colors',
          item
            ? cn('border bg-terra-panel', getRarityBorderClass(item.rarity))
            : 'border-dashed border-terra-border text-gray-500 hover:border-terra-gold hover:text-gray-300 bg-terra-bg'
        )}
      >
        <span className="block text-xs text-gray-500 mb-0.5">{label}</span>
        <span className={item ? 'text-white font-semibold' : 'text-gray-500'}>
          {item?.name ?? 'Empty'}
        </span>
      </button>
      {open && (
        <ItemPickerModal
          label={label}
          types={types}
          currentName={value}
          onSelect={(i) => onSet(i)}
          onClear={onClear}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function LoadoutEditor({ loadout }: { loadout: Loadout }) {
  const { updateLoadout } = useBuildStore()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(loadout.name)

  function saveName() {
    updateLoadout(loadout.id, { name: nameInput.trim() || loadout.name })
    setEditingName(false)
  }

  function setArmorSlot(idx: number, name: string | undefined) {
    const newArmor = [...loadout.slots.armor] as [string?, string?, string?]
    newArmor[idx] = name
    updateLoadout(loadout.id, { slots: { ...loadout.slots, armor: newArmor } })
  }

  function setAccessorySlot(idx: number, name: string | undefined) {
    const newAcc = [...loadout.slots.accessories]
    newAcc[idx] = name
    updateLoadout(loadout.id, { slots: { ...loadout.slots, accessories: newAcc } })
  }

  function setWeapon(name: string | undefined) {
    updateLoadout(loadout.id, { slots: { ...loadout.slots, weapon: name } })
  }

  function setClass(c: BuildClass) {
    updateLoadout(loadout.id, { class: c })
  }

  const armorLabels = ['Head', 'Chest', 'Legs']

  return (
    <div className="flex-1 bg-terra-surface border border-terra-border rounded-xl p-5 overflow-y-auto">
      {/* Name + class */}
      <div className="flex items-center justify-between mb-5">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false) } }}
              autoFocus
              className="bg-terra-bg border border-terra-gold rounded px-2 py-1 text-sm text-white focus:outline-none"
            />
            <button onClick={saveName} className="text-terra-green"><Check className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-white text-base">{loadout.name}</h2>
            <button onClick={() => setEditingName(true)} className="text-gray-500 hover:text-terra-gold transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Class selector */}
      <div className="flex gap-1 mb-6">
        {classes.map((c) => {
          const { label, icon: Icon, color } = classConfig[c]
          return (
            <button
              key={c}
              onClick={() => setClass(c)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded text-sm font-semibold transition-colors',
                loadout.class === c
                  ? 'bg-terra-panel text-terra-gold border border-terra-gold'
                  : 'text-gray-400 hover:text-white border border-transparent'
              )}
            >
              <Icon className={cn('w-4 h-4', color)} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Slots */}
      <div className="space-y-5">
        <div>
          <h3 className="text-terra-gold text-xs font-pixel mb-2">Armor</h3>
          <div className="grid grid-cols-3 gap-2">
            {armorLabels.map((label, i) => (
              <SlotButton
                key={label}
                label={label}
                value={loadout.slots.armor[i]}
                types={slotTypes.armor}
                onSet={(item) => setArmorSlot(i, item.name)}
                onClear={() => setArmorSlot(i, undefined)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-terra-gold text-xs font-pixel mb-2">Weapon</h3>
          <div className="max-w-xs">
            <SlotButton
              label="Main Weapon"
              value={loadout.slots.weapon}
              types={slotTypes.weapon}
              onSet={(item) => setWeapon(item.name)}
              onClear={() => setWeapon(undefined)}
            />
          </div>
        </div>

        <div>
          <h3 className="text-terra-gold text-xs font-pixel mb-2">Accessories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {loadout.slots.accessories.map((acc, i) => (
              <SlotButton
                key={i}
                label={`Accessory ${i + 1}`}
                value={acc}
                types={slotTypes.accessory}
                onSet={(item) => setAccessorySlot(i, item.name)}
                onClear={() => setAccessorySlot(i, undefined)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BuildStages() {
  const { loadouts, activeLoadoutId, addLoadout, removeLoadout, setActive, duplicateLoadout } = useBuildStore()
  const activeLoadout = loadouts.find((l) => l.id === activeLoadoutId)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const selectedClass: BuildClass = activeLoadout?.class ?? 'melee'

  function createNew() {
    addLoadout({
      name: `Loadout ${loadouts.length + 1}`,
      class: 'melee',
      slots: defaultSlots(),
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="font-pixel text-terra-gold text-sm mb-6">Build Planner</h1>

      <div className="mb-4 bg-terra-surface border border-terra-border rounded-xl p-4">
        <h2 className="text-terra-gold text-xs font-pixel mb-3">Recommended Builds By Stage ({classConfig[selectedClass].label})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {stagedBuilds[selectedClass].map((entry) => (
            <div key={entry.stage} className="bg-terra-bg border border-terra-border rounded-lg p-3">
              <h3 className="text-sm font-semibold text-white mb-2">{entry.stage}</h3>
              <p className="text-xs text-gray-400 mb-1">Armor</p>
              <p className="text-sm text-gray-200 mb-2">{entry.armor}</p>
              <p className="text-xs text-gray-400 mb-1">Weapon</p>
              <p className="text-sm text-gray-200 mb-2">{entry.weapon}</p>
              <p className="text-xs text-gray-400 mb-1">Accessories</p>
              <p className="text-sm text-gray-200">{entry.accessories.join(' • ')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-160px)]">
        {/* Sidebar */}
        <div className="md:w-56 shrink-0 flex flex-col gap-2">
          <button
            onClick={createNew}
            className="flex items-center justify-center gap-2 w-full border border-dashed border-terra-border rounded-lg py-2.5 text-sm text-gray-400 hover:border-terra-gold hover:text-terra-gold transition-colors"
          >
            <Plus className="w-4 h-4" /> New Loadout
          </button>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {loadouts.map((l) => {
              const { icon: Icon, color } = classConfig[l.class]
              return (
                <div
                  key={l.id}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer border transition-colors',
                    l.id === activeLoadoutId
                      ? 'bg-terra-panel border-terra-gold'
                      : 'bg-terra-surface border-terra-border hover:border-terra-gold'
                  )}
                  onClick={() => setActive(l.id)}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', color)} />
                  <span className="text-sm text-white truncate flex-1">{l.name}</span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateLoadout(l.id) }}
                      className="text-gray-500 hover:text-terra-sky transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(l.id) }}
                      className="text-gray-500 hover:text-terra-red transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Editor */}
        {activeLoadout ? (
          <LoadoutEditor key={activeLoadout.id} loadout={activeLoadout} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-terra-surface border border-terra-border rounded-xl">
            <div className="text-center">
              <Shield className="w-12 h-12 text-terra-border mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">No loadouts yet</p>
              <button
                onClick={createNew}
                className="flex items-center gap-2 mx-auto bg-terra-panel border border-terra-gold text-terra-gold rounded-lg px-4 py-2 text-sm hover:bg-terra-gold hover:text-terra-bg transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Loadout
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-terra-surface border border-terra-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-pixel text-terra-red text-xs mb-4">Delete Loadout?</h3>
            <p className="text-gray-300 text-sm mb-6">
              This will permanently delete this loadout.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { removeLoadout(confirmDelete); setConfirmDelete(null) }}
                className="flex-1 bg-terra-red text-white rounded py-2 text-sm font-semibold hover:opacity-90"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
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
