import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X, Sword } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useBossStore } from '@/store/bossStore'
import { bosses } from '@/data/index'

const navItems = [
  { to: '/items', label: 'Items' },
  { to: '/bosses', label: 'Bosses' },
  { to: '/build', label: 'Builds' },
  { to: '/npcs', label: 'NPCs' },
]

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'px-3 py-2 rounded text-sm font-semibold transition-colors duration-150',
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
  const [open, setOpen] = useState(false)
  const defeatedBosses = useBossStore((s) => s.defeatedBosses)
  const total = bosses.length
  const defeated = defeatedBosses.length

  return (
    <header className="sticky top-0 z-50 bg-terra-surface border-b border-terra-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 group">
          <Sword className="w-5 h-5 text-terra-gold" />
          <span className="font-pixel text-terra-gold text-xs group-hover:opacity-80 transition-opacity hidden sm:block">
            TC
          </span>
          <span className="font-semibold text-white text-sm hidden md:block">
            Terraria Companion
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Boss progress pill */}
          <NavLink
            to="/bosses"
            className="hidden sm:flex items-center gap-1.5 bg-terra-bg border border-terra-border rounded-full px-3 py-1 text-xs hover:border-terra-gold transition-colors"
          >
            <span className="text-terra-gold font-bold">{defeated}</span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">{total}</span>
            <span className="text-gray-500 ml-0.5">bosses</span>
          </NavLink>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 text-gray-300 hover:text-terra-gold"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden bg-terra-surface border-t border-terra-border px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} onClick={() => setOpen(false)} />
          ))}
          <div className="mt-2 pt-2 border-t border-terra-border flex items-center gap-2 px-3 py-1">
            <span className="text-terra-gold font-bold text-sm">{defeated}/{total}</span>
            <span className="text-gray-400 text-sm">bosses defeated</span>
          </div>
        </div>
      )}
    </header>
  )
}
