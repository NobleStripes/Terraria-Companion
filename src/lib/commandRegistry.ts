import { items } from '@/data'
import { setHighContrastPreference, setReducedMotionPreference } from '@/lib/accessibilityPreferences'
import {
  createCommandRegistryCore,
  type PaletteCommand,
  type CommandGroup,
} from '@/lib/commandRegistryCore'

interface CreateCommandRegistryOptions {
  navigate: (to: string) => void
  pathname: string
}

export function createCommandRegistry({ navigate, pathname }: CreateCommandRegistryOptions): PaletteCommand[] {
  return createCommandRegistryCore({
    navigate,
    pathname,
    items,
    setHighContrastPreference,
    setReducedMotionPreference,
  })
}

export type { CommandGroup, PaletteCommand }
