import { Link } from 'react-router-dom'
import { Search, Shield, Sword, Users } from 'lucide-react'
import { DATA_VERSION } from '@/data/index'

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
    title: 'Build Planner',
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

      <p className="text-center text-gray-600 text-xs mt-10">Data version: {DATA_VERSION}</p>
    </div>
  )
}
