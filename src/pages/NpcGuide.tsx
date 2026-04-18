import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, Copy, Heart, ThumbsDown, Minus, Trees, X } from 'lucide-react'
import { npcs } from '@/data/index'
import type { Npc } from '@/types/npc'
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

export default function NpcGuide() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  const biomeFilterParam = searchParams.get('biome')
  const plannerBiomeParam = searchParams.get('plannerBiome')
  const roommatesParam = searchParams.get('roommates')

  const biomeFilter = biomeFilterParam && allBiomeNames.includes(biomeFilterParam) ? biomeFilterParam : null
  const plannerBiome = plannerBiomeParam && allBiomeNames.includes(plannerBiomeParam) ? plannerBiomeParam : 'Forest'
  const plannerRoommates = roommatesParam
    ? roommatesParam
        .split(',')
        .map((value) => value.trim())
        .filter((value, index, list) => value && list.indexOf(value) === index)
        .filter((value) => npcs.some((npc) => npc.id === value))
        .slice(0, 4)
    : []

  function updateParams(next: { biome?: string | null; plannerBiome?: string; roommates?: string[] }) {
    const nextParams = new URLSearchParams(searchParams)
    const nextBiome = next.biome !== undefined ? next.biome : biomeFilter
    const nextPlannerBiome = next.plannerBiome ?? plannerBiome
    const nextRoommates = next.roommates ?? plannerRoommates

    if (nextBiome) {
      nextParams.set('biome', nextBiome)
    } else {
      nextParams.delete('biome')
    }

    if (nextPlannerBiome === 'Forest') {
      nextParams.delete('plannerBiome')
    } else {
      nextParams.set('plannerBiome', nextPlannerBiome)
    }

    if (nextRoommates.length > 0) {
      nextParams.set('roommates', nextRoommates.join(','))
    } else {
      nextParams.delete('roommates')
    }

    setSearchParams(nextParams)
  }

  async function copyCurrentViewLink() {
    const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }

    window.setTimeout(() => {
      setCopyState('idle')
    }, 1800)
  }

  const filteredNpcs = biomeFilter
    ? npcs.filter(
        (n) =>
          n.happiness.lovedBiomes.includes(biomeFilter) ||
          n.happiness.likedBiomes.includes(biomeFilter)
      )
    : npcs

  const plannerRows = [...npcs]
    .map((npc) => {
      let score = 0
      if (npc.happiness.lovedBiomes.includes(plannerBiome)) score += 3
      if (npc.happiness.likedBiomes.includes(plannerBiome)) score += 1
      if (npc.happiness.dislikedBiomes.includes(plannerBiome)) score -= 1
      if (npc.happiness.hatedBiomes.includes(plannerBiome)) score -= 3

      for (const roommateId of plannerRoommates) {
        const roommate = npcs.find((entry) => entry.id === roommateId)
        if (!roommate) continue

        if (npc.happiness.lovedNeighbors.includes(roommate.name)) score += 2
        if (npc.happiness.likedNeighbors.includes(roommate.name)) score += 1
        if (npc.happiness.dislikedNeighbors.includes(roommate.name)) score -= 1
        if (npc.happiness.hatedNeighbors.includes(roommate.name)) score -= 2

        if (roommate.happiness.lovedNeighbors.includes(npc.name)) score += 1
        if (roommate.happiness.hatedNeighbors.includes(npc.name)) score -= 1
      }

      return { npc, score }
    })
    .sort((a, b) => b.score - a.score)

  const conflictRows = plannerRows.filter((row) => row.score < 0).slice(0, 4)

  function togglePlannerRoommate(id: string) {
    const nextRoommates = plannerRoommates.includes(id)
      ? plannerRoommates.filter((entry) => entry !== id)
      : [...plannerRoommates, id].slice(0, 4)

    updateParams({ roommates: nextRoommates })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-3 mb-6">
        <div>
          <h1 className="font-pixel text-terra-gold text-sm">NPC Guide</h1>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">
            Plan biome happiness, compare roommate compatibility, and review unlock and housing notes for every town NPC.
          </p>
        </div>

        <div className="bg-terra-surface border border-terra-border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-terra-panel border border-terra-border flex items-center justify-center shrink-0">
              <Trees className="w-4 h-4 text-terra-gold" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Need biome details?</p>
              <p className="text-gray-400 text-xs mt-1">
                Open the dedicated biome route for layer filters, hardmode-only views, and shareable biome URLs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyCurrentViewLink}
              className="inline-flex items-center justify-center gap-1.5 rounded border border-terra-border px-3 py-2 text-xs text-gray-300 hover:border-terra-gold hover:text-white transition-colors"
            >
              {copyState === 'copied' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copyState === 'copied' ? 'Link copied' : copyState === 'error' ? 'Copy failed' : 'Copy setup'}
            </button>
            <Link
              to="/biomes"
              className="inline-flex items-center justify-center rounded border border-terra-border px-3 py-2 text-xs text-gray-300 hover:border-terra-gold hover:text-white transition-colors"
            >
              Browse Biomes
            </Link>
          </div>
        </div>
      </div>

      <div>
          <div className="mb-5 bg-terra-surface border border-terra-border rounded-lg p-4">
            <h3 className="text-terra-gold text-xs font-pixel mb-3">NPC Happiness Planner</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Target Biome</p>
                <select
                  value={plannerBiome}
                  onChange={(e) => updateParams({ plannerBiome: e.target.value })}
                  className="w-full bg-terra-bg border border-terra-border rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-terra-gold"
                >
                  {allBiomeNames.map((name) => (
                    <option key={`planner-${name}`} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Current Roommates (up to 4)</p>
                <div className="flex flex-wrap gap-1">
                  {npcs.map((npc) => (
                    <button
                      key={`planner-roommate-${npc.id}`}
                      onClick={() => togglePlannerRoommate(npc.id)}
                      className={cn(
                        'text-[10px] px-2 py-1 rounded border transition-colors',
                        plannerRoommates.includes(npc.id)
                          ? 'border-terra-gold text-terra-gold bg-terra-panel'
                          : 'border-terra-border text-gray-400 hover:text-white hover:border-terra-gold'
                      )}
                    >
                      {npc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Best Fits</p>
                <div className="space-y-1">
                  {plannerRows.slice(0, 6).map((row) => (
                    <div key={`planner-best-${row.npc.id}`} className="flex items-center justify-between text-xs border border-terra-border rounded px-2 py-1">
                      <span className="text-gray-200">{row.npc.name}</span>
                      <span className={cn('font-semibold', row.score >= 3 ? 'text-terra-green' : row.score > 0 ? 'text-terra-sky' : 'text-gray-400')}>
                        {row.score >= 0 ? `+${row.score}` : row.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Conflict Highlights</p>
                {conflictRows.length === 0 ? (
                  <div className="text-xs text-terra-green border border-terra-border rounded px-2 py-1">No major conflicts for this setup.</div>
                ) : (
                  <div className="space-y-1">
                    {conflictRows.map((row) => (
                      <div key={`planner-conflict-${row.npc.id}`} className="flex items-center justify-between text-xs border border-terra-border rounded px-2 py-1">
                        <span className="text-gray-200">{row.npc.name}</span>
                        <span className="text-terra-red font-semibold">{row.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Biome filter chips */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => updateParams({ biome: null })}
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
                onClick={() => updateParams({ biome: biomeFilter === name ? null : name })}
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
    </div>
  )
}
