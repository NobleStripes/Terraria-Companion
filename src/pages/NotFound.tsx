import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="bg-terra-surface border border-terra-border rounded-xl p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-terra-panel border border-terra-border flex items-center justify-center">
          <Compass className="w-6 h-6 text-terra-gold" />
        </div>
        <p className="font-pixel text-terra-gold text-xs mb-4">Page Not Found</p>
        <h1 className="text-white text-xl font-semibold mb-2">That route does not exist in this world.</h1>
        <p className="text-gray-400 text-sm max-w-lg mx-auto mb-6">
          Head back to the main guide pages to continue browsing items, bosses, builds, NPCs, and biomes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/"
            className="px-4 py-2 rounded border border-terra-gold bg-terra-panel text-terra-gold text-sm hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
          <Link
            to="/biomes"
            className="px-4 py-2 rounded border border-terra-border text-gray-300 text-sm hover:border-terra-gold hover:text-white transition-colors"
          >
            Browse Biomes
          </Link>
        </div>
      </div>
    </div>
  )
}