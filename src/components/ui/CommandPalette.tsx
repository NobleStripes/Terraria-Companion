import { useMemo } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { items } from '@/data'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PaletteCommand = {
  id: string
  label: string
  keywords: string
  group: 'Navigate' | 'Actions' | 'Presets' | 'Items'
  run: () => void
}

function setContrastMode(enabled: boolean) {
  window.localStorage.setItem('terra-high-contrast', enabled ? '1' : '0')
  document.documentElement.dataset.contrast = enabled ? 'high' : 'normal'
}

function setReducedMotionMode(enabled: boolean) {
  window.localStorage.setItem('terra-reduced-motion', enabled ? '1' : '0')
  document.documentElement.dataset.reducedMotion = enabled ? 'true' : 'false'
}

function goToItemRoute(itemId: number): string {
  return `/items/${itemId}`
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()

  const commands = useMemo<PaletteCommand[]>(() => {
    const routeCommands: PaletteCommand[] = [
      { id: 'go-home', label: 'Go to Home', keywords: 'home dashboard start', group: 'Navigate', run: () => navigate('/') },
      { id: 'go-items', label: 'Go to Items', keywords: 'items lookup search', group: 'Navigate', run: () => navigate('/items') },
      { id: 'go-sources', label: 'Go to Sources', keywords: 'item source explorer', group: 'Navigate', run: () => navigate('/sources') },
      { id: 'go-bosses', label: 'Go to Bosses', keywords: 'boss tracker progression', group: 'Navigate', run: () => navigate('/bosses') },
      { id: 'go-prep', label: 'Go to Prep Guide', keywords: 'prep guide readiness', group: 'Navigate', run: () => navigate('/prep') },
      { id: 'go-builds', label: 'Go to Builds', keywords: 'recommended builds progression', group: 'Navigate', run: () => navigate('/build') },
      { id: 'go-loadouts', label: 'Go to Loadouts', keywords: 'loadout builder compare', group: 'Navigate', run: () => navigate('/loadouts') },
      { id: 'go-biomes', label: 'Go to Biomes', keywords: 'biome guide', group: 'Navigate', run: () => navigate('/biomes') },
      { id: 'go-npcs', label: 'Go to NPCs', keywords: 'npc guide happiness', group: 'Navigate', run: () => navigate('/npcs') },
    ]

    const actionCommands: PaletteCommand[] = [
      {
        id: 'toggle-contrast-on',
        label: 'Enable High Contrast',
        keywords: 'contrast accessibility readability',
        group: 'Actions',
        run: () => setContrastMode(true),
      },
      {
        id: 'toggle-contrast-off',
        label: 'Disable High Contrast',
        keywords: 'contrast accessibility readability',
        group: 'Actions',
        run: () => setContrastMode(false),
      },
      {
        id: 'toggle-motion-on',
        label: 'Enable Reduced Motion',
        keywords: 'motion accessibility animation',
        group: 'Actions',
        run: () => setReducedMotionMode(true),
      },
      {
        id: 'toggle-motion-off',
        label: 'Disable Reduced Motion',
        keywords: 'motion accessibility animation',
        group: 'Actions',
        run: () => setReducedMotionMode(false),
      },
    ]

    const presetCommands: PaletteCommand[] = [
      {
        id: 'preset-items-wishlist',
        label: 'Preset: Item Wishlist Drops',
        keywords: 'items preset wishlist drops farm',
        group: 'Presets',
        run: () => navigate('/items?loot=wishlist'),
      },
      {
        id: 'preset-items-acquired',
        label: 'Preset: Item Acquired Drops',
        keywords: 'items preset acquired drops',
        group: 'Presets',
        run: () => navigate('/items?loot=acquired'),
      },
      {
        id: 'preset-bosses-missing',
        label: 'Preset: Bosses Missing Drops',
        keywords: 'bosses preset missing drops',
        group: 'Presets',
        run: () => navigate('/bosses?drops=missing'),
      },
      {
        id: 'preset-builds-early-melee',
        label: 'Preset: Builds Early Melee',
        keywords: 'build preset early melee',
        group: 'Presets',
        run: () => navigate('/build?class=melee&cap=Early%20Game&stage=Early%20Game'),
      },
      {
        id: 'preset-builds-endgame-summoner',
        label: 'Preset: Builds Endgame Summoner',
        keywords: 'build preset endgame summoner',
        group: 'Presets',
        run: () => navigate('/build?class=summoner&cap=Endgame&stage=Endgame'),
      },
    ]

    const itemCommands: PaletteCommand[] = items.map((item) => ({
      id: `item-${item.id}`,
      label: `Item: ${item.name}`,
      keywords: `${item.name} ${item.type} ${item.progressionTier ?? ''}`,
      group: 'Items',
      run: () => navigate(goToItemRoute(item.id)),
    }))

    return [...routeCommands, ...actionCommands, ...presetCommands, ...itemCommands]
  }, [navigate])

  const grouped = useMemo(() => {
    return {
      Navigate: commands.filter((command) => command.group === 'Navigate'),
      Actions: commands.filter((command) => command.group === 'Actions'),
      Presets: commands.filter((command) => command.group === 'Presets'),
      Items: commands.filter((command) => command.group === 'Items'),
    }
  }, [commands])

  function runCommand(command: PaletteCommand) {
    command.run()
    onOpenChange(false)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command Palette"
      className="fixed left-1/2 top-[12vh] z-[80] w-[min(92vw,760px)] -translate-x-1/2 overflow-hidden rounded-xl border border-terra-border bg-terra-surface shadow-2xl"
      overlayClassName="fixed inset-0 z-[70] bg-black/60"
    >
      <div className="border-b border-terra-border px-3 py-2">
        <Command.Input
          placeholder="Search pages, items, and actions..."
          className="w-full bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-gray-500"
        />
      </div>
      <Command.List className="max-h-[68vh] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-4 text-sm text-gray-500">No command found.</Command.Empty>

        <Command.Group heading="Navigate" className="mb-2">
          {grouped.Navigate.map((command) => (
            <Command.Item
              key={command.id}
              value={`${command.label} ${command.keywords}`}
              onSelect={() => runCommand(command)}
              className="cursor-pointer rounded px-3 py-2 text-sm text-gray-300 data-[selected=true]:bg-terra-panel data-[selected=true]:text-terra-gold"
            >
              {command.label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Actions" className="mb-2">
          {grouped.Actions.map((command) => (
            <Command.Item
              key={command.id}
              value={`${command.label} ${command.keywords}`}
              onSelect={() => runCommand(command)}
              className="cursor-pointer rounded px-3 py-2 text-sm text-gray-300 data-[selected=true]:bg-terra-panel data-[selected=true]:text-terra-gold"
            >
              {command.label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Presets" className="mb-2">
          {grouped.Presets.map((command) => (
            <Command.Item
              key={command.id}
              value={`${command.label} ${command.keywords}`}
              onSelect={() => runCommand(command)}
              className="cursor-pointer rounded px-3 py-2 text-sm text-gray-300 data-[selected=true]:bg-terra-panel data-[selected=true]:text-terra-gold"
            >
              {command.label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Items" className="mb-2">
          {grouped.Items.map((command) => (
            <Command.Item
              key={command.id}
              value={`${command.label} ${command.keywords}`}
              onSelect={() => runCommand(command)}
              className="cursor-pointer rounded px-3 py-2 text-sm text-gray-300 data-[selected=true]:bg-terra-panel data-[selected=true]:text-terra-gold"
            >
              {command.label}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
      <div className="border-t border-terra-border px-3 py-2 text-[11px] text-gray-500">
        Tip: Use Ctrl+K (Windows/Linux) or Cmd+K (macOS) to open.
      </div>
    </Command.Dialog>
  )
}
