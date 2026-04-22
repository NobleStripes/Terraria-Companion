import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Copy, Plus, Shield, Trash2 } from 'lucide-react'
import type { BuildClass } from '@/types/boss'
import type { Item } from '@/types/item'
import type { Loadout } from '@/store/buildStore'
import { Link, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { items, itemsById } from '@/data/index'
import { useBuildStore } from '@/store/buildStore'

const classConfig: Record<BuildClass, { label: string; accent: string }> = {
  melee: { label: 'Melee', accent: 'text-terra-red' },
  ranged: { label: 'Ranged', accent: 'text-terra-green' },
  magic: { label: 'Magic', accent: 'text-terra-purple' },
  summoner: { label: 'Summoner', accent: 'text-terra-gold' },
}

const loadoutClasses = Object.keys(classConfig) as BuildClass[]
const itemIdByName = new Map(items.map((item) => [item.name.toLowerCase(), item.id]))

const headArmorPattern = /(helmet|mask|hood|hat|wig|cap|head|brow)/i
const bodyArmorPattern = /(breastplate|chestplate|plate|mail|shirt|robe|jerkin|cuirass|dress|plating|tunic|vest)/i
const legArmorPattern = /(greaves|leggings|pants|trousers|legguards|legging)/i

function sortByName(left: Item, right: Item) {
  return left.name.localeCompare(right.name)
}

function filterArmorByPattern(pattern: RegExp) {
  return items.filter((item) => item.type === 'armor' && pattern.test(item.name)).sort(sortByName)
}

const weaponOptions = items.filter((item) => item.type === 'weapon').sort(sortByName)
const accessoryOptions = items.filter((item) => item.type === 'accessory').sort(sortByName)
const headArmorOptions = filterArmorByPattern(headArmorPattern)
const bodyArmorOptions = filterArmorByPattern(bodyArmorPattern)
const legArmorOptions = filterArmorByPattern(legArmorPattern)

type LoadoutFilePayload = {
  exportedAt: string
  loadouts: unknown
  activeLoadoutId?: unknown
}

type ImportedLoadoutCandidate = {
  id?: unknown
  name?: unknown
  class?: unknown
  slots?: {
    armor?: unknown[]
    accessories?: unknown[]
    weapon?: unknown
  }
}

function buildDefaultName(buildClass: BuildClass, count: number) {
  return `${classConfig[buildClass].label} Loadout ${count + 1}`
}

function isBuildClass(value: unknown): value is BuildClass {
  return value === 'melee' || value === 'ranged' || value === 'magic' || value === 'summoner'
}

function normalizeImportedItemId(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return itemsById.has(value) ? value : undefined
  }

  if (typeof value === 'string') {
    return itemIdByName.get(value.toLowerCase())
  }

  return undefined
}

function normalizeImportedLoadout(candidate: ImportedLoadoutCandidate): Loadout | null {
  if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string' || !isBuildClass(candidate.class)) {
    return null
  }

  const armor = Array.isArray(candidate.slots?.armor) ? candidate.slots.armor : []
  const accessories = Array.isArray(candidate.slots?.accessories) ? candidate.slots.accessories : []

  return {
    id: candidate.id,
    name: candidate.name,
    class: candidate.class,
    slots: {
      armor: [
        normalizeImportedItemId(armor[0]),
        normalizeImportedItemId(armor[1]),
        normalizeImportedItemId(armor[2]),
      ],
      accessories: Array.from({ length: 5 }, (_, index) => normalizeImportedItemId(accessories[index])),
      weapon: normalizeImportedItemId(candidate.slots?.weapon),
    },
  }
}

function isCuratedArmorPlaceholder(item: Item | undefined) {
  return item?.type === 'armor' && item.tooltip.startsWith('Curated progression recommendation for ')
}

function ItemPicker({
  label,
  valueId,
  options,
  placeholder,
  onCommit,
}: {
  label: string
  valueId?: number
  options: Item[]
  placeholder: string
  onCommit: (itemId?: number) => void
}) {
  const listId = useId()
  const currentName = valueId ? itemsById.get(valueId)?.name ?? '' : ''
  const [value, setValue] = useState(currentName)

  const optionIdByName = useMemo(
    () => new Map(options.map((option) => [option.name.toLowerCase(), option.id])),
    [options]
  )

  function commitValue(nextValue: string) {
    const trimmed = nextValue.trim()

    if (!trimmed) {
      onCommit(undefined)
      return
    }

    const resolvedId = optionIdByName.get(trimmed.toLowerCase())
    if (resolvedId) {
      onCommit(resolvedId)
    }
  }

  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.16em] text-gray-500">{label}</span>
      <div className="flex gap-2">
        <input
          list={listId}
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value
            setValue(nextValue)

            if (!nextValue.trim()) {
              onCommit(undefined)
              return
            }

            const resolvedId = optionIdByName.get(nextValue.trim().toLowerCase())
            if (resolvedId) {
              onCommit(resolvedId)
            }
          }}
          onBlur={() => {
            commitValue(value)
            const trimmed = value.trim()
            if (trimmed && !optionIdByName.has(trimmed.toLowerCase())) {
              setValue(currentName)
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-terra-border bg-terra-bg px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-terra-gold"
        />
        <button
          type="button"
          onClick={() => {
            setValue('')
            onCommit(undefined)
          }}
          className="shrink-0 rounded-lg border border-terra-border px-3 py-2.5 text-xs text-gray-300 transition-colors hover:border-terra-gold hover:text-terra-gold"
        >
          Clear
        </button>
      </div>
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.id} value={option.name} />
        ))}
      </datalist>
    </label>
  )
}

export default function LoadoutBuilder() {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    loadouts,
    activeLoadoutId,
    createLoadout,
    mergeLoadouts,
    renameLoadout,
    updateLoadoutClass,
    setWeapon,
    setArmorSlot,
    setAccessorySlot,
    setActive,
    duplicateLoadout,
    removeLoadout,
  } = useBuildStore()
  const [statusMessage, setStatusMessage] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const activeLoadout = useMemo(
    () => loadouts.find((loadout) => loadout.id === activeLoadoutId) ?? null,
    [activeLoadoutId, loadouts]
  )
  const equippedItems = useMemo(() => {
    if (!activeLoadout) {
      return []
    }

    return [
      activeLoadout.slots.weapon,
      ...activeLoadout.slots.armor,
      ...activeLoadout.slots.accessories,
    ]
      .flatMap((itemId) => (itemId ? [itemsById.get(itemId)] : []))
      .filter((item): item is Item => Boolean(item))
  }, [activeLoadout])

  const totalDefense = equippedItems.reduce((sum, item) => sum + (item.defense ?? 0), 0)
  const activeWeapon = activeLoadout?.slots.weapon ? itemsById.get(activeLoadout.slots.weapon) : undefined
  const accessoryCount = activeLoadout?.slots.accessories.filter(Boolean).length ?? 0
  const curatedArmorPlaceholder = activeLoadout?.slots.armor[0] ? itemsById.get(activeLoadout.slots.armor[0]) : undefined
  const showCuratedArmorNotice = Boolean(
    activeLoadout &&
    isCuratedArmorPlaceholder(curatedArmorPlaceholder) &&
    !activeLoadout.slots.armor[1] &&
    !activeLoadout.slots.armor[2]
  )

  useEffect(() => {
    if (!statusMessage) {
      return
    }

    const timeout = window.setTimeout(() => setStatusMessage(''), 1800)
    return () => window.clearTimeout(timeout)
  }, [statusMessage])

  useEffect(() => {
    const requestedLoadoutId = searchParams.get('loadout')

    if (!requestedLoadoutId || requestedLoadoutId === activeLoadoutId) {
      return
    }

    if (loadouts.some((loadout) => loadout.id === requestedLoadoutId)) {
      setActive(requestedLoadoutId)
    }
  }, [activeLoadoutId, loadouts, searchParams, setActive])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)

    if (activeLoadoutId) {
      next.set('loadout', activeLoadoutId)
    } else {
      next.delete('loadout')
    }

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [activeLoadoutId, searchParams, setSearchParams])

  function handleCreate(buildClass: BuildClass) {
    createLoadout({
      name: buildDefaultName(buildClass, loadouts.length),
      class: buildClass,
    })
    setStatusMessage(`${classConfig[buildClass].label} loadout created`)
  }

  function exportLoadouts() {
    const payload = {
      exportedAt: new Date().toISOString(),
      loadouts,
      activeLoadoutId,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'loadouts.json'
    anchor.click()
    window.URL.revokeObjectURL(url)
    setStatusMessage('Loadouts exported')
  }

  async function copyActiveLoadoutLink() {
    if (!activeLoadout) {
      return
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      setStatusMessage('Link copied')
    } catch {
      setStatusMessage('Clipboard blocked')
    }
  }

  function triggerImport() {
    importRef.current?.click()
  }

  async function importLoadouts(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as LoadoutFilePayload
      const importedLoadouts = Array.isArray(parsed.loadouts)
        ? parsed.loadouts
            .map((entry) => normalizeImportedLoadout(entry as ImportedLoadoutCandidate))
            .filter((entry): entry is Loadout => entry !== null)
        : []

      if (importedLoadouts.length === 0) {
        setStatusMessage('No valid loadouts found')
        return
      }

      const preferredActiveLoadoutId =
        typeof parsed.activeLoadoutId === 'string' && importedLoadouts.some((loadout) => loadout.id === parsed.activeLoadoutId)
          ? parsed.activeLoadoutId
          : undefined

      mergeLoadouts(importedLoadouts, preferredActiveLoadoutId)
      setStatusMessage(`Imported ${importedLoadouts.length} loadout${importedLoadouts.length === 1 ? '' : 's'}`)
    } catch {
      setStatusMessage('Loadout import failed')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 lg:py-12 space-y-6">
      <section className="rounded-2xl border border-terra-border bg-terra-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Loadout Builder</p>
            <h1 className="font-pixel text-terra-gold text-lg sm:text-xl">Save and swap practical gear sets</h1>
            <p className="mt-3 max-w-3xl text-sm text-gray-400 leading-relaxed">
              Build class-specific weapon, armor, and accessory sets with local persistence. This first slice focuses on stable editing and quick swapping before deeper optimizer or share features land.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {loadoutClasses.map((buildClass) => (
              <button
                key={buildClass}
                type="button"
                onClick={() => handleCreate(buildClass)}
                className="inline-flex items-center gap-2 rounded-lg border border-terra-border px-3 py-2.5 text-sm text-gray-200 transition-colors hover:border-terra-gold hover:text-terra-gold"
              >
                <Plus className="h-4 w-4" />
                New {classConfig[buildClass].label}
              </button>
            ))}
            <button
              type="button"
              onClick={exportLoadouts}
              className="inline-flex items-center gap-2 rounded-lg border border-terra-border px-3 py-2.5 text-sm text-gray-200 transition-colors hover:border-terra-gold hover:text-terra-gold"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => void copyActiveLoadoutLink()}
              disabled={!activeLoadout}
              className="inline-flex items-center gap-2 rounded-lg border border-terra-border px-3 py-2.5 text-sm text-gray-200 transition-colors hover:border-terra-gold hover:text-terra-gold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy Link
            </button>
            <button
              type="button"
              onClick={triggerImport}
              className="inline-flex items-center gap-2 rounded-lg border border-terra-border px-3 py-2.5 text-sm text-gray-200 transition-colors hover:border-terra-gold hover:text-terra-gold"
            >
              Import JSON
            </button>
          </div>
        </div>
        <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={importLoadouts} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-gray-500">Active loadout selection is synced to the URL.</p>
          {activeLoadout ? (
            <p className="text-gray-400">
              Current share target: <span className="text-white">{activeLoadout.name}</span>
            </p>
          ) : null}
        </div>
        {statusMessage ? <p className="mt-2 text-xs text-terra-gold">{statusMessage}</p> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-terra-border bg-terra-surface p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-white">Saved Loadouts</h2>
            <span className="text-xs text-gray-500">{loadouts.length}</span>
          </div>

          {loadouts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-terra-border bg-terra-bg px-4 py-6 text-sm text-gray-400 leading-relaxed">
              Create your first loadout from one of the class buttons above. This starter version stores one weapon slot, three armor slots, and five accessories.
            </div>
          ) : (
            <div className="space-y-3">
              {loadouts.map((loadout) => {
                const isActive = loadout.id === activeLoadoutId

                return (
                  <button
                    key={loadout.id}
                    type="button"
                    onClick={() => setActive(loadout.id)}
                    className={cn(
                      'w-full rounded-xl border px-4 py-3 text-left transition-colors',
                      isActive
                        ? 'border-terra-gold bg-terra-panel'
                        : 'border-terra-border bg-terra-bg hover:border-terra-gold/70'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{loadout.name}</p>
                        <p className={cn('text-xs mt-1', classConfig[loadout.class].accent)}>
                          {classConfig[loadout.class].label}
                        </p>
                      </div>
                      {isActive && <Shield className="h-4 w-4 text-terra-gold" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        <section className="rounded-2xl border border-terra-border bg-terra-surface p-5 sm:p-6">
          {!activeLoadout ? (
            <div className="rounded-xl border border-dashed border-terra-border bg-terra-bg px-4 py-10 text-center text-sm text-gray-400">
              Select a loadout to start editing, or create a new one from the class shortcuts.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid gap-4 sm:grid-cols-2 flex-1">
                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-gray-500">Loadout Name</span>
                    <input
                      value={activeLoadout.name}
                      onChange={(event) => renameLoadout(activeLoadout.id, event.target.value)}
                      className="w-full rounded-lg border border-terra-border bg-terra-bg px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-terra-gold"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-gray-500">Class</span>
                    <select
                      value={activeLoadout.class}
                      onChange={(event) => updateLoadoutClass(activeLoadout.id, event.target.value as BuildClass)}
                      className="w-full rounded-lg border border-terra-border bg-terra-bg px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-terra-gold"
                    >
                      {loadoutClasses.map((buildClass) => (
                        <option key={buildClass} value={buildClass}>
                          {classConfig[buildClass].label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => duplicateLoadout(activeLoadout.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-terra-border px-3 py-2.5 text-sm text-gray-200 transition-colors hover:border-terra-gold hover:text-terra-gold"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLoadout(activeLoadout.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-terra-border px-3 py-2.5 text-sm text-gray-200 transition-colors hover:border-terra-red hover:text-terra-red"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="grid gap-4">
                  {showCuratedArmorNotice && curatedArmorPlaceholder ? (
                    <div className="rounded-xl border border-terra-gold/40 bg-terra-panel/40 px-4 py-3 text-sm text-gray-300 leading-relaxed">
                      <span className="text-terra-gold font-semibold">Curated set placeholder:</span> this loadout was bootstrapped from a stage recommendation, so <span className="text-white">{curatedArmorPlaceholder.name}</span> is stored as a set-level placeholder in the first armor slot. Replace the head, body, and leg slots with exact pieces if you want a fully explicit loadout.
                    </div>
                  ) : null}

                  <ItemPicker
                    key={`${activeLoadout.id}-weapon-${activeLoadout.slots.weapon ?? 'empty'}`}
                    label="Weapon"
                    valueId={activeLoadout.slots.weapon}
                    options={weaponOptions}
                    placeholder="Select a weapon"
                    onCommit={(itemId) => setWeapon(activeLoadout.id, itemId)}
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <ItemPicker
                      key={`${activeLoadout.id}-armor-head-${activeLoadout.slots.armor[0] ?? 'empty'}`}
                      label="Head Armor"
                      valueId={activeLoadout.slots.armor[0]}
                      options={headArmorOptions}
                      placeholder="Helmet, hood, hat..."
                      onCommit={(itemId) => setArmorSlot(activeLoadout.id, 0, itemId)}
                    />
                    <ItemPicker
                      key={`${activeLoadout.id}-armor-body-${activeLoadout.slots.armor[1] ?? 'empty'}`}
                      label="Body Armor"
                      valueId={activeLoadout.slots.armor[1]}
                      options={bodyArmorOptions}
                      placeholder="Breastplate, robe..."
                      onCommit={(itemId) => setArmorSlot(activeLoadout.id, 1, itemId)}
                    />
                    <ItemPicker
                      key={`${activeLoadout.id}-armor-legs-${activeLoadout.slots.armor[2] ?? 'empty'}`}
                      label="Leg Armor"
                      valueId={activeLoadout.slots.armor[2]}
                      options={legArmorOptions}
                      placeholder="Greaves, leggings..."
                      onCommit={(itemId) => setArmorSlot(activeLoadout.id, 2, itemId)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {activeLoadout.slots.accessories.map((itemId, index) => (
                      <ItemPicker
                        key={`${activeLoadout.id}-accessory-${index}-${itemId ?? 'empty'}`}
                        label={`Accessory ${index + 1}`}
                        valueId={itemId}
                        options={accessoryOptions}
                        placeholder="Select an accessory"
                        onCommit={(nextItemId) => setAccessorySlot(activeLoadout.id, index, nextItemId)}
                      />
                    ))}
                  </div>
                </div>

                <aside className="rounded-xl border border-terra-border bg-terra-bg p-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-gray-500 mb-2">Snapshot</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-terra-border bg-terra-surface px-3 py-2.5">
                        <p className="text-gray-500 text-xs mb-1">Defense</p>
                        <p className="text-white font-semibold">{totalDefense}</p>
                      </div>
                      <div className="rounded-lg border border-terra-border bg-terra-surface px-3 py-2.5">
                        <p className="text-gray-500 text-xs mb-1">Accessories</p>
                        <p className="text-white font-semibold">{accessoryCount}/5</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-terra-border bg-terra-surface px-3 py-3">
                    <p className="text-gray-500 text-xs mb-1">Weapon Damage</p>
                    <p className="text-white font-semibold">
                      {activeWeapon?.damage ? `${activeWeapon.damage}` : 'No weapon selected'}
                    </p>
                    {activeWeapon && (
                      <p className="mt-2 text-xs text-gray-400 leading-relaxed">{activeWeapon.name}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs mb-2">Equipped Items</p>
                    <div className="flex flex-wrap gap-2">
                      {equippedItems.length === 0 ? (
                        <p className="text-sm text-gray-400">No slots filled yet.</p>
                      ) : (
                        equippedItems.map((item) => (
                          <span
                            key={item.id}
                            className={cn(
                              'inline-flex items-center rounded-full border border-terra-border bg-terra-surface px-3 py-1 text-xs text-gray-300',
                              isCuratedArmorPlaceholder(item) && 'border-terra-gold/40 text-terra-gold'
                            )}
                          >
                            {item.name}
                            {isCuratedArmorPlaceholder(item) ? ' (set placeholder)' : ''}
                          </span>
                        ))
                      )}
                    </div>
                    {activeLoadout ? (
                      <p className="mt-2 text-xs text-gray-500">
                        Shareable link: <Link to={`?loadout=${activeLoadout.id}`} className="text-terra-sky hover:text-terra-gold transition-colors">active selection URL</Link>
                      </p>
                    ) : null}
                  </div>
                </aside>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}