import { useMemo } from 'react'
import { Command } from 'cmdk'
import { useLocation, useNavigate } from 'react-router-dom'
import { createCommandRegistry, type CommandGroup, type PaletteCommand } from '@/lib/commandRegistry'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const commands = useMemo<PaletteCommand[]>(
    () => createCommandRegistry({ navigate, pathname: location.pathname }),
    [location.pathname, navigate]
  )

  const grouped = useMemo<Record<CommandGroup, PaletteCommand[]>>(() => {
    const sorted = [...commands].sort((left, right) => right.priority - left.priority)
    return {
      Navigate: sorted.filter((command) => command.group === 'Navigate'),
      Actions: sorted.filter((command) => command.group === 'Actions'),
      Presets: sorted.filter((command) => command.group === 'Presets'),
      Items: sorted.filter((command) => command.group === 'Items'),
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
