import test from 'node:test'
import assert from 'node:assert/strict'
import { createCommandRegistryCore, type PaletteCommand } from '../src/lib/commandRegistryCore.ts'

function setupRegistry(pathname: string) {
  const navigations: string[] = []
  const contrastCalls: boolean[] = []
  const motionCalls: boolean[] = []

  const commands = createCommandRegistryCore({
    pathname,
    navigate: (to) => {
      navigations.push(to)
    },
    items: [
      { id: 7001, name: 'Terra Blade', type: 'weapon', progressionTier: 'endgame' },
      { id: 7002, name: 'Magic Mirror', type: 'tool', progressionTier: 'early-game' },
    ],
    setHighContrastPreference: (enabled) => {
      contrastCalls.push(enabled)
    },
    setReducedMotionPreference: (enabled) => {
      motionCalls.push(enabled)
    },
  })

  return { commands, navigations, contrastCalls, motionCalls }
}

function findCommand(commands: PaletteCommand[], id: string): PaletteCommand {
  const command = commands.find((entry) => entry.id === id)
  assert.ok(command, `expected command ${id} to exist`)
  return command
}

test('route priorities are boosted for active section', () => {
  const bosses = setupRegistry('/bosses')
  const items = setupRegistry('/items/7001')

  const bossesCommand = findCommand(bosses.commands, 'go-bosses')
  const itemsCommand = findCommand(items.commands, 'go-bosses')
  const itemsItemCommand = findCommand(items.commands, 'item-7001')

  assert.equal(bossesCommand.priority, 115)
  assert.equal(itemsCommand.priority, 85)
  assert.equal(itemsItemCommand.priority, 45)
})

test('navigation and preset commands run with expected targets', () => {
  const registry = setupRegistry('/')

  findCommand(registry.commands, 'go-builds').run()
  findCommand(registry.commands, 'preset-bosses-missing').run()

  assert.deepEqual(registry.navigations, ['/build', '/bosses?drops=missing'])
})

test('action commands call preference setters', () => {
  const registry = setupRegistry('/')

  findCommand(registry.commands, 'toggle-contrast-on').run()
  findCommand(registry.commands, 'toggle-contrast-off').run()
  findCommand(registry.commands, 'toggle-motion-on').run()
  findCommand(registry.commands, 'toggle-motion-off').run()

  assert.deepEqual(registry.contrastCalls, [true, false])
  assert.deepEqual(registry.motionCalls, [true, false])
})
