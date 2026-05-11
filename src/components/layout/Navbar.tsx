import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X, Sword } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useBossStore } from '@/store/bossStore'
import { bosses } from '@/data/index'
import { useViewport } from '@/hooks/useViewport'

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

export default function Navbar() {
  const { isDesktop } = useViewport()
  const [open, setOpen] = useState(false)
  const [highContrast, setHighContrast] = useState(() => window.localStorage.getItem('terra-high-contrast') === '1')
  const [reducedMotion, setReducedMotion] = useState(() => window.localStorage.getItem('terra-reduced-motion') === '1')
  const defeatedBosses = useBossStore((s) => s.defeatedBosses)
  const total = bosses.length
  const defeated = defeatedBosses.length

  useEffect(() => {
    document.documentElement.dataset.contrast = highContrast ? 'high' : 'normal'
    window.localStorage.setItem('terra-high-contrast', highContrast ? '1' : '0')
  }, [highContrast])

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion ? 'true' : 'false'
    window.localStorage.setItem('terra-reduced-motion', reducedMotion ? '1' : '0')
  }, [reducedMotion])

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
              onClick={() => setHighContrast((v) => !v)}
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
              onClick={() => setReducedMotion((v) => !v)}
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

      {open && !isDesktop && (
        <div id="mobile-navigation" className="md:hidden bg-terra-surface border-t border-terra-border px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />
          ))}
          <div className="mt-2 pt-3 border-t border-terra-border grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => setHighContrast((value) => !value)}
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
              onClick={() => setReducedMotion((value) => !value)}
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
