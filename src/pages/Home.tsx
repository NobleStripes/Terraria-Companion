import { Link } from 'react-router-dom'
import { Map, Search, Shield, Sword, Users } from 'lucide-react'
import { APP_VERSION, DATA_VERSION, changelog } from '@/data/index'

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
    to: '/biomes',
    icon: Map,
    title: 'Biome Guide',
    description: 'Browse biome layers, key resources, enemies, and NPC housing fits.',
    color: 'text-terra-purple',
  },
  {
    to: '/npcs',
    icon: Users,
    title: 'NPC Guide',
    description: 'Plan happiness, check unlocks, and review housing requirements.',
    color: 'text-terra-sky',
  },
]

export default function Home() {
  const latestRelease = changelog[0]
  const previousReleases = changelog.slice(1, 3)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 lg:py-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:items-start mb-8">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-terra-border bg-terra-surface px-3 py-1.5 text-xs text-gray-300 mb-4">
            <span className="font-semibold text-terra-gold">v{APP_VERSION}</span>
            <span className="text-gray-500">|</span>
            <span>Responsive polish for desktop, tablet, and phone</span>
          </div>
          <h1 className="font-pixel text-terra-gold text-lg sm:text-xl md:text-2xl lg:text-3xl mb-4 leading-relaxed">
            Terraria Companion
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0">
            Your all-in-one reference for Terraria {DATA_VERSION} with item lookup, boss prep, build progression, and guide pages tuned for desktop and second-screen play.
          </p>
        </div>

        {latestRelease && (
          <section className="bg-terra-surface border border-terra-border rounded-xl p-5 text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Latest Release</p>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="font-semibold text-white">v{latestRelease.version}</h2>
              <span className="text-xs text-gray-500">{latestRelease.date}</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              {latestRelease.highlights.map((line) => (
                <li key={line} className="leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
        {features.map(({ to, icon: Icon, title, description, color }) => (
          <Link
            key={to}
            to={to}
            className="block bg-terra-surface border border-terra-border rounded-xl p-5 sm:p-6 hover:border-terra-gold hover:bg-terra-panel transition-colors duration-150 group min-h-36 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-gold/70 focus-visible:ring-offset-1 focus-visible:ring-offset-terra-bg"
          >
            <div className="flex items-start gap-4">
              <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${color} shrink-0 mt-0.5`} />
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

      {previousReleases.length > 0 && (
        <div className="mt-8 bg-terra-surface border border-terra-border rounded-xl p-5">
          <h2 className="font-pixel text-terra-gold text-xs mb-3">Recent Updates</h2>
          <div className="space-y-3">
            {previousReleases.map((entry) => (
              <div key={`${entry.version}-${entry.date}`} className="border border-terra-border rounded-lg p-3 bg-terra-bg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
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

      <p className="text-center text-gray-600 text-xs mt-10">App v{APP_VERSION} | Data version: {DATA_VERSION}</p>
    </div>
  )
}
