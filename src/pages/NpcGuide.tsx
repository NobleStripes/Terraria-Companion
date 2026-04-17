import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Heart, ThumbsDown, Minus, X } from 'lucide-react'
import { npcs, biomes } from '@/data/index'
import type { Npc } from '@/types/npc'
import type { Biome } from '@/types/biome'
import { cn } from '@/lib/cn'

const allBiomeNames = Array.from(
  new Set([
    ...npcs.flatMap((n) => [
      ...n.happiness.lovedBiomes,
      ...n.happiness.likedBiomes,
      ...n.happiness.dislikedBiomes,
      ...n.happiness.hatedBiomes,
    ]),
  ])
).sort()

type HappinessTier = 'loved' | 'liked' | 'disliked' | 'hated'

const tierConfig: Record<HappinessTier, { label: string; color: string; icon: React.ElementType }> = {
  loved: { label: 'Loved', color: 'text-terra-green', icon: Heart },
  liked: { label: 'Liked', color: 'text-terra-sky', icon: Minus },
  disliked: { label: 'Disliked', color: 'text-terra-orange', icon: ThumbsDown },
  hated: { label: 'Hated', color: 'text-terra-red', icon: X },
}

function HappinessPill({ text, tier }: { text: string; tier: HappinessTier }) {
  const { color } = tierConfig[tier]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs border', color, 'border-current opacity-90')}>
      {text}
    </span>
  )
}

function NpcCard({ npc }: { npc: Npc }) {
  const [expanded, setExpanded] = useState(false)

  const lovedBiome = npc.happiness.lovedBiomes[0]
  const lovedNeighbor = npc.happiness.lovedNeighbors[0]

  return (
    <div className="bg-terra-surface border border-terra-border rounded-lg overflow-hidden hover:border-terra-gold transition-colors">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm mb-1">{npc.name}</h3>
            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{npc.unlockCondition}</p>
          </div>
          <div className="shrink-0 mt-0.5">
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>

        {!expanded && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lovedBiome && <HappinessPill text={lovedBiome} tier="loved" />}
            {lovedNeighbor && <HappinessPill text={lovedNeighbor} tier="liked" />}
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-terra-border space-y-4">
          {/* Unlock */}
          <div>
            <h4 className="text-terra-gold text-xs font-pixel mb-1">Unlock</h4>
            <p className="text-gray-300 text-xs leading-relaxed">{npc.unlockCondition}</p>
          </div>

          {/* Happiness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h4 className="text-terra-gold text-xs font-pixel mb-2">Biome Preferences</h4>
              <div className="space-y-1.5">
                {(['loved', 'liked', 'disliked', 'hated'] as HappinessTier[]).map((tier) => {
                  const biomeKey = `${tier}Biomes` as keyof typeof npc.happiness
                  const list = npc.happiness[biomeKey] as string[]
                  if (!list.length) return null
                  return (
                    <div key={tier}>
                      <span className={cn('text-xs font-semibold', tierConfig[tier].color)}>
                        {tierConfig[tier].label}:
                      </span>
                      <span className="text-gray-300 text-xs ml-1">{list.join(', ')}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <h4 className="text-terra-gold text-xs font-pixel mb-2">Neighbor Preferences</h4>
              <div className="space-y-1.5">
                {(['loved', 'liked', 'disliked', 'hated'] as HappinessTier[]).map((tier) => {
                  const neighborKey = `${tier}Neighbors` as keyof typeof npc.happiness
                  const list = npc.happiness[neighborKey] as string[]
                  if (!list.length) return null
                  return (
                    <div key={tier}>
                      <span className={cn('text-xs font-semibold', tierConfig[tier].color)}>
                        {tierConfig[tier].label}:
                      </span>
                      <span className="text-gray-300 text-xs ml-1">{list.join(', ')}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sells */}
          {npc.sells.length > 0 && (
            <div>
              <h4 className="text-terra-gold text-xs font-pixel mb-2">Sells</h4>
              <div className="flex flex-wrap gap-1">
                {npc.sells.map((s) => (
                  <span key={s} className="bg-terra-bg border border-terra-border rounded px-2 py-0.5 text-xs text-gray-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Housing */}
          <div>
            <h4 className="text-terra-gold text-xs font-pixel mb-1">Housing</h4>
            <p className="text-gray-400 text-xs">{npc.housingRequirements}</p>
          </div>
        </div>
      )}
    </div>
  )
}

const layerOrder: Record<string, number> = {
  sky: 0, surface: 1, underground: 2, cavern: 3, underworld: 4,
}

function BiomeCard({ biome }: { biome: Biome }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-terra-surface border border-terra-border rounded-lg overflow-hidden hover:border-terra-gold transition-colors">
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="font-semibold text-white text-sm">{biome.name}</h3>
            <span className="text-xs border border-terra-border rounded px-1.5 py-0.5 text-gray-400 capitalize shrink-0">
              {biome.layer}
            </span>
            {biome.hardmodeOnly && (
              <span className="text-xs border border-terra-gold rounded px-1.5 py-0.5 text-terra-gold shrink-0">
                Hardmode
              </span>
            )}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
        </div>
        {!expanded && <p className="text-gray-500 text-xs mt-1 line-clamp-1">{biome.description}</p>}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-terra-border space-y-4">
          <p className="text-gray-300 text-sm leading-relaxed mt-3">{biome.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="text-terra-gold text-xs font-pixel mb-2">Resources</h4>
              <ul className="space-y-1">
                {biome.resources.map((r) => <li key={r} className="text-gray-300 text-xs">• {r}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-terra-gold text-xs font-pixel mb-2">Common Enemies</h4>
              <ul className="space-y-1">
                {biome.commonEnemies.map((e) => <li key={e} className="text-gray-300 text-xs">• {e}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-terra-gold text-xs font-pixel mb-2">Unique Features</h4>
              <ul className="space-y-1">
                {biome.uniqueFeatures.map((f) => <li key={f} className="text-gray-300 text-xs">• {f}</li>)}
              </ul>
            </div>
          </div>

          {biome.happyNpcs.length > 0 && (
            <div>
              <h4 className="text-terra-gold text-xs font-pixel mb-2">Happy NPCs Here</h4>
              <div className="flex flex-wrap gap-1">
                {biome.happyNpcs.map((id) => {
                  const npc = npcs.find((n) => n.id === id)
                  return (
                    <span key={id} className="bg-terra-bg border border-terra-green rounded px-2 py-0.5 text-xs text-terra-green">
                      {npc?.name ?? id}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function NpcGuide() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'biomes' ? 'biomes' : 'npcs'
  const [biomeFilter, setBiomeFilter] = useState<string | null>(null)

  function setTab(t: string) {
    setSearchParams(t === 'biomes' ? { tab: 'biomes' } : {})
  }

  const filteredNpcs = biomeFilter
    ? npcs.filter(
        (n) =>
          n.happiness.lovedBiomes.includes(biomeFilter) ||
          n.happiness.likedBiomes.includes(biomeFilter)
      )
    : npcs

  const sortedBiomes = [...biomes].sort(
    (a, b) => (layerOrder[a.layer] ?? 5) - (layerOrder[b.layer] ?? 5)
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="font-pixel text-terra-gold text-sm mb-6">NPC & Biome Guide</h1>

      {/* Tabs */}
      <div className="flex border-b border-terra-border mb-6">
        {['npcs', 'biomes'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-6 py-2.5 text-sm font-semibold capitalize transition-colors',
              tab === t
                ? 'text-terra-gold border-b-2 border-terra-gold -mb-px'
                : 'text-gray-400 hover:text-white'
            )}
          >
            {t === 'npcs' ? 'NPCs' : 'Biomes'}
          </button>
        ))}
      </div>

      {tab === 'npcs' && (
        <div>
          {/* Biome filter chips */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => setBiomeFilter(null)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                biomeFilter === null
                  ? 'border-terra-gold text-terra-gold bg-terra-panel'
                  : 'border-terra-border text-gray-400 hover:border-terra-gold hover:text-terra-gold'
              )}
            >
              All
            </button>
            {allBiomeNames.map((name) => (
              <button
                key={name}
                onClick={() => setBiomeFilter(biomeFilter === name ? null : name)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                  biomeFilter === name
                    ? 'border-terra-gold text-terra-gold bg-terra-panel'
                    : 'border-terra-border text-gray-400 hover:border-terra-gold hover:text-terra-gold'
                )}
              >
                {name}
              </button>
            ))}
          </div>

          {biomeFilter && (
            <p className="text-gray-400 text-xs mb-3">
              Showing {filteredNpcs.length} NPCs that love or like the <strong className="text-terra-gold">{biomeFilter}</strong> biome
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNpcs.map((npc) => (
              <NpcCard key={npc.id} npc={npc} />
            ))}
          </div>

          {filteredNpcs.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No NPCs prefer this biome.</p>
          )}
        </div>
      )}

      {tab === 'biomes' && (
        <div className="space-y-3">
          {sortedBiomes.map((biome) => (
            <BiomeCard key={biome.id} biome={biome} />
          ))}
        </div>
      )}
    </div>
  )
}
