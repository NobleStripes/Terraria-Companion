import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Download, Menu, Upload, X, Sword } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useBossStore } from '@/store/bossStore'
import { bosses } from '@/data/index'
import { useViewport } from '@/hooks/useViewport'
import {
  applyCompanionBackup,
  createCompanionBackupPayload,
  parseCompanionBackup,
  serializeCompanionBackup,
} from '@/lib/backupRestore'
import {
  ACCESSIBILITY_PREFERENCES_CHANGED,
  readHighContrastPreference,
  readReducedMotionPreference,
  setHighContrastPreference,
  setReducedMotionPreference,
  syncAccessibilityPreferencesToDom,
} from '@/lib/accessibilityPreferences'

const navItems = [
  { to: '/items', label: 'Items' },
  { to: '/sources', label: 'Sources' },
  { to: '/bosses', label: 'Bosses' },
  { to: '/prep', label: 'Prep' },
  { to: '/build', label: 'Builds' },
  { to: '/loadouts', label: 'Loadouts' },
  { to: '/biomes', label: 'Biomes' },
  { to: '/npcs', label: 'NPCs' },
]

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'px-3 py-2.5 min-h-11 rounded text-sm font-semibold transition-colors duration-150 flex items-center',
          isActive
            ? 'text-terra-gold bg-terra-panel'
            : 'text-gray-300 hover:text-terra-gold hover:bg-terra-panel'
        )
      }
    >
      {label}
    </NavLink>
  )
}

export default function Navbar({ onOpenCommandPalette }: { onOpenCommandPalette?: () => void }) {
  const { isDesktop } = useViewport()
  const [open, setOpen] = useState(false)
  const [backupStatus, setBackupStatus] = useState('')
  const [highContrast, setHighContrast] = useState(() => readHighContrastPreference())
  const [reducedMotion, setReducedMotion] = useState(() => readReducedMotionPreference())
  const backupInputRef = useRef<HTMLInputElement>(null)
  const defeatedBosses = useBossStore((s) => s.defeatedBosses)
  const total = bosses.length
  const defeated = defeatedBosses.length

  useEffect(() => {
    syncAccessibilityPreferencesToDom()

    function syncFromPreferences() {
      setHighContrast(readHighContrastPreference())
      setReducedMotion(readReducedMotionPreference())
    }

    window.addEventListener(ACCESSIBILITY_PREFERENCES_CHANGED, syncFromPreferences)
    window.addEventListener('storage', syncFromPreferences)

    return () => {
      window.removeEventListener(ACCESSIBILITY_PREFERENCES_CHANGED, syncFromPreferences)
      window.removeEventListener('storage', syncFromPreferences)
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!backupStatus) {
      return
    }

    const timeout = window.setTimeout(() => setBackupStatus(''), 3500)
    return () => window.clearTimeout(timeout)
  }, [backupStatus])

  function exportBackup() {
    try {
      const payload = createCompanionBackupPayload()
      const blob = new Blob([serializeCompanionBackup(payload)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      const dateStamp = payload.exportedAt.slice(0, 10)
      anchor.download = `terraria-companion-backup-${dateStamp}.json`
      anchor.click()
      window.URL.revokeObjectURL(url)
      setBackupStatus('Backup exported')
    } catch {
      setBackupStatus('Export failed')
    }
  }

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const payload = parseCompanionBackup(text)
      applyCompanionBackup(payload)
      setBackupStatus('Backup restored. Reloading...')
      window.setTimeout(() => window.location.reload(), 250)
    } catch {
      setBackupStatus('Invalid backup file')
    }
  }

  function triggerBackupImport() {
    backupInputRef.current?.click()
  }

  return (
    <header className="sticky top-0 z-50 bg-terra-surface border-b border-terra-border">
      <div className="max-w-7xl mx-auto px-4 min-h-14 py-2 flex items-center justify-between gap-3">
        <NavLink to="/" className="flex items-center gap-2 group min-w-0">
          <Sword className="w-5 h-5 text-terra-gold" />
          <span className="font-pixel text-terra-gold text-xs group-hover:opacity-80 transition-opacity hidden sm:block">
            TC
          </span>
          <span className="font-semibold text-white text-sm hidden lg:block truncate">
            Terraria Companion
          </span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center min-w-0">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={onOpenCommandPalette}
              className="px-2.5 py-1.5 min-h-9 rounded text-[10px] border border-terra-border text-gray-400 hover:text-white hover:border-terra-gold transition-colors"
            >
              Cmd/Ctrl+K
            </button>
            <button
              onClick={exportBackup}
              className="px-2.5 py-1.5 min-h-9 rounded text-[10px] border border-terra-border text-gray-400 hover:text-white hover:border-terra-gold transition-colors inline-flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Backup
            </button>
            <button
              onClick={triggerBackupImport}
              className="px-2.5 py-1.5 min-h-9 rounded text-[10px] border border-terra-border text-gray-400 hover:text-white hover:border-terra-gold transition-colors inline-flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              Restore
            </button>
            <button
              onClick={() => {
                const next = !highContrast
                setHighContrast(next)
                setHighContrastPreference(next)
              }}
              className={cn(
                'px-2.5 py-1.5 min-h-9 rounded text-[10px] border transition-colors',
                highContrast
                  ? 'border-terra-gold text-terra-gold bg-terra-panel'
                  : 'border-terra-border text-gray-400 hover:text-white hover:border-terra-gold'
              )}
              aria-pressed={highContrast}
            >
              Contrast
            </button>
            <button
              onClick={() => {
                const next = !reducedMotion
                setReducedMotion(next)
                setReducedMotionPreference(next)
              }}
              className={cn(
                'px-2.5 py-1.5 min-h-9 rounded text-[10px] border transition-colors',
                reducedMotion
                  ? 'border-terra-gold text-terra-gold bg-terra-panel'
                  : 'border-terra-border text-gray-400 hover:text-white hover:border-terra-gold'
              )}
              aria-pressed={reducedMotion}
            >
              Motion
            </button>
          </div>

          {/* Boss progress pill */}
          <NavLink
            to="/bosses"
            className="hidden sm:flex items-center gap-1.5 bg-terra-bg border border-terra-border rounded-full px-3 py-1.5 min-h-9 text-xs hover:border-terra-gold transition-colors"
          >
            <span className="text-terra-gold font-bold">{defeated}</span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">{total}</span>
            <span className="text-gray-500 ml-0.5">bosses</span>
          </NavLink>

          <button
            className="md:hidden p-2.5 min-h-11 min-w-11 flex items-center justify-center text-gray-300 hover:text-terra-gold"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-haspopup="true"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <input
        ref={backupInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={importBackup}
      />
      {backupStatus ? (
        <div className="max-w-7xl mx-auto px-4 pb-2 text-xs text-terra-gold">{backupStatus}</div>
      ) : null}

      {open && !isDesktop && (
        <div id="mobile-navigation" className="md:hidden bg-terra-surface border-t border-terra-border px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />
          ))}
          <div className="mt-2 pt-3 border-t border-terra-border grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={onOpenCommandPalette}
              className="px-3 py-2.5 min-h-11 rounded border border-terra-border text-sm text-left text-gray-300 hover:text-white hover:border-terra-gold transition-colors"
            >
              Open Command Palette
            </button>
            <button
              onClick={exportBackup}
              className="px-3 py-2.5 min-h-11 rounded border border-terra-border text-sm text-left text-gray-300 hover:text-white hover:border-terra-gold transition-colors inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Backup
            </button>
            <button
              onClick={triggerBackupImport}
              className="px-3 py-2.5 min-h-11 rounded border border-terra-border text-sm text-left text-gray-300 hover:text-white hover:border-terra-gold transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Restore Backup
            </button>
          </div>
          <div className="mt-2 pt-3 border-t border-terra-border grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => {
                const next = !highContrast
                setHighContrast(next)
                setHighContrastPreference(next)
              }}
              className={cn(
                'px-3 py-2.5 min-h-11 rounded border text-sm text-left transition-colors',
                highContrast
                  ? 'border-terra-gold text-terra-gold bg-terra-panel'
                  : 'border-terra-border text-gray-300 hover:text-white hover:border-terra-gold'
              )}
              aria-pressed={highContrast}
            >
              Contrast {highContrast ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => {
                const next = !reducedMotion
                setReducedMotion(next)
                setReducedMotionPreference(next)
              }}
              className={cn(
                'px-3 py-2.5 min-h-11 rounded border text-sm text-left transition-colors',
                reducedMotion
                  ? 'border-terra-gold text-terra-gold bg-terra-panel'
                  : 'border-terra-border text-gray-300 hover:text-white hover:border-terra-gold'
              )}
              aria-pressed={reducedMotion}
            >
              Motion {reducedMotion ? 'Reduced' : 'Normal'}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2 px-3 py-2.5 min-h-11 rounded border border-terra-border bg-terra-bg">
            <span className="text-terra-gold font-bold text-sm">{defeated}/{total}</span>
            <span className="text-gray-400 text-sm">bosses defeated</span>
          </div>
        </div>
      )}
    </header>
  )
}
