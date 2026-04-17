import { Link } from 'react-router-dom'
import { Search, Shield, Sword, Users } from 'lucide-react'
import { DATA_VERSION, changelog } from '@/data/index'

const features = [
  {
    to: '/items',
    icon: Search,
    title: 'Item Lookup',
    description: 'Search any item, view crafting recipes, sources, and stats.',
    color: 'text-terra-sky',
  },
  {
    to: '/bosses',
    icon: Sword,
    title: 'Boss Tracker',
    description: 'Track defeated bosses and get recommended gear & strategies.',
    color: 'text-terra-red',
  },
  {
    to: '/build',
    icon: Shield,
    title: 'Recommended Builds',
    description: 'View recommended builds by progression stage and class.',
    color: 'text-terra-green',
  },
  {
    to: '/npcs',
    icon: Users,
    title: 'NPC & Biomes',
    description: 'NPC happiness, housing requirements, and biome guides.',
    color: 'text-terra-purple',
  },
]

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="font-pixel text-terra-gold text-lg md:text-2xl mb-4 leading-relaxed">
          Terraria Companion
        </h1>
        <p className="text-gray-400 text-base max-w-xl mx-auto">
          Your all-in-one reference for Terraria {DATA_VERSION} — items, bosses, builds, and NPCs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map(({ to, icon: Icon, title, description, color }) => (
          <Link
            key={to}
            to={to}
            className="block bg-terra-surface border border-terra-border rounded-lg p-6 hover:border-terra-gold hover:bg-terra-panel transition-colors duration-150 group"
          >
            <div className="flex items-start gap-4">
              <Icon className={`w-8 h-8 ${color} shrink-0 mt-0.5`} />
              <div>
                <h2 className="font-semibold text-white text-base mb-1 group-hover:text-terra-gold transition-colors">
                  {title}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {changelog.length > 0 && (
        <div className="mt-8 bg-terra-surface border border-terra-border rounded-lg p-5">
          <h2 className="font-pixel text-terra-gold text-xs mb-3">Data Changelog</h2>
          <div className="space-y-3">
            {changelog.slice(0, 2).map((entry) => (
              <div key={`${entry.version}-${entry.date}`} className="border border-terra-border rounded p-3 bg-terra-bg">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm text-white font-semibold">v{entry.version}</span>
                  <span className="text-xs text-gray-500">{entry.date}</span>
                </div>
                <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
                  {entry.highlights.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-gray-600 text-xs mt-10">Data version: {DATA_VERSION}</p>
    </div>
  )
}
