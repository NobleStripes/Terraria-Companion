import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, Copy, Mountain, Trees } from 'lucide-react'
import { biomes, npcs } from '@/data/index'
import type { Biome } from '@/types/biome'
import { cn } from '@/lib/cn'

const layerOrder: Record<Biome['layer'], number> = {
  sky: 0,
  surface: 1,
  underground: 2,
  cavern: 3,
  underworld: 4,
}

const layerLabels: Record<Biome['layer'], string> = {
  sky: 'Sky',
  surface: 'Surface',
  underground: 'Underground',
  cavern: 'Cavern',
  underworld: 'Underworld',
}

function BiomeCard({ biome }: { biome: Biome }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="bg-terra-surface border border-terra-border rounded-lg overflow-hidden hover:border-terra-gold transition-colors">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="w-full text-left p-4"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h2 className="font-semibold text-white text-sm">{biome.name}</h2>
              <span className="text-[10px] border border-terra-border rounded px-1.5 py-0.5 text-gray-400 uppercase tracking-wide">
                {layerLabels[biome.layer]}
              </span>
              {biome.hardmodeOnly && (
                <span className="text-[10px] border border-terra-gold rounded px-1.5 py-0.5 text-terra-gold uppercase tracking-wide">
                  Hardmode
                </span>
              )}
            </div>
            <p className={cn('text-xs text-gray-400 leading-relaxed', !expanded && 'line-clamp-2')}>
              {biome.description}
            </p>
          </div>
          <span className="shrink-0 mt-0.5 text-gray-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-terra-border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
            <div>
              <h3 className="text-terra-gold text-xs font-pixel mb-2">Resources</h3>
              <ul className="space-y-1">
                {biome.resources.map((resource) => (
                  <li key={resource} className="text-gray-300 text-xs">• {resource}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-terra-gold text-xs font-pixel mb-2">Common Enemies</h3>
              <ul className="space-y-1">
                {biome.commonEnemies.map((enemy) => (
                  <li key={enemy} className="text-gray-300 text-xs">• {enemy}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-terra-gold text-xs font-pixel mb-2">Unique Features</h3>
              <ul className="space-y-1">
                {biome.uniqueFeatures.map((feature) => (
                  <li key={feature} className="text-gray-300 text-xs">• {feature}</li>
                ))}
              </ul>
            </div>
          </div>

          {biome.happyNpcs.length > 0 && (
            <div>
              <h3 className="text-terra-gold text-xs font-pixel mb-2">NPCs That Prefer It</h3>
              <div className="flex flex-wrap gap-1.5">
                {biome.happyNpcs.map((npcId) => {
                  const npc = npcs.find((entry) => entry.id === npcId)
                  return (
                    <Link
                      key={npcId}
                      to={`/npcs/${npcId}`}
                      className="bg-terra-bg border border-terra-green rounded px-2 py-1 text-xs text-terra-green hover:border-terra-gold hover:text-terra-gold transition-colors"
                    >
                      {npc?.name ?? npcId}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export default function BiomeGuide() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')

  const layerParam = searchParams.get('layer')
  const selectedLayer: 'all' | Biome['layer'] =
    layerParam === 'sky' ||
    layerParam === 'surface' ||
    layerParam === 'underground' ||
    layerParam === 'cavern' ||
    layerParam === 'underworld'
      ? layerParam
      : 'all'
  const hardmodeOnly = searchParams.get('hardmode') === '1'

  function updateFilters(next: { layer?: 'all' | Biome['layer']; hardmode?: boolean }) {
    const nextParams = new URLSearchParams(searchParams)
    const layer = next.layer ?? selectedLayer
    const hardmode = next.hardmode ?? hardmodeOnly

    if (layer === 'all') {
      nextParams.delete('layer')
    } else {
      nextParams.set('layer', layer)
    }

    if (hardmode) {
      nextParams.set('hardmode', '1')
    } else {
      nextParams.delete('hardmode')
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

  const layerCounts = useMemo(() => {
    return biomes.reduce<Record<'all' | Biome['layer'], number>>(
      (counts, biome) => {
        counts.all += 1
        counts[biome.layer] += 1
        return counts
      },
      { all: 0, sky: 0, surface: 0, underground: 0, cavern: 0, underworld: 0 }
    )
  }, [])

  const filteredBiomes = useMemo(() => {
    return [...biomes]
      .filter((biome) => selectedLayer === 'all' || biome.layer === selectedLayer)
      .filter((biome) => !hardmodeOnly || biome.hardmodeOnly)
      .sort((left, right) => {
        const layerDiff = layerOrder[left.layer] - layerOrder[right.layer]
        if (layerDiff !== 0) return layerDiff
        return left.name.localeCompare(right.name)
      })
  }, [hardmodeOnly, selectedLayer])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-terra-panel border border-terra-border flex items-center justify-center shrink-0">
            <Trees className="w-5 h-5 text-terra-gold" />
          </div>
          <div>
            <h1 className="font-pixel text-terra-gold text-sm">Biome Guide</h1>
            <p className="text-gray-400 text-sm mt-1 max-w-2xl">
              Browse Terraria biomes by layer, hardmode status, notable resources, enemy pressure, and NPC housing fit.
            </p>
          </div>
        </div>

        <div className="bg-terra-surface border border-terra-border rounded-lg p-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-terra-gold text-xs font-pixel">Filters</p>
            <div className="flex flex-wrap gap-2">
              {(['all', 'sky', 'surface', 'underground', 'cavern', 'underworld'] as const).map((layer) => (
                <button
                  key={layer}
                  type="button"
                  onClick={() => updateFilters({ layer })}
                  className={cn(
                    'px-3 py-1.5 rounded border text-xs transition-colors',
                    selectedLayer === layer
                      ? 'border-terra-gold text-terra-gold bg-terra-panel'
                      : 'border-terra-border text-gray-300 hover:border-terra-gold hover:text-white'
                  )}
                >
                  {layer === 'all' ? 'All Layers' : layerLabels[layer]}
                  <span className="text-gray-500 ml-1">{layerCounts[layer]}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={hardmodeOnly}
              onChange={(event) => updateFilters({ hardmode: event.target.checked })}
              className="accent-[var(--color-terra-gold)]"
            />
            Show only hardmode biomes
          </label>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={copyCurrentViewLink}
              className="inline-flex items-center gap-1.5 rounded border border-terra-border px-3 py-2 text-xs text-gray-300 hover:border-terra-gold hover:text-white transition-colors"
            >
              {copyState === 'copied' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copyState === 'copied' ? 'Link copied' : copyState === 'error' ? 'Copy failed' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-gray-500">
        <span>{filteredBiomes.length} biome{filteredBiomes.length === 1 ? '' : 's'} shown</span>
        <span className="inline-flex items-center gap-1.5 text-gray-400">
          <Mountain className="w-3.5 h-3.5" />
          Sorted by world layer
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredBiomes.map((biome) => (
          <BiomeCard key={biome.id} biome={biome} />
        ))}
      </div>

      {filteredBiomes.length === 0 && (
        <div className="mt-6 bg-terra-surface border border-dashed border-terra-border rounded-lg p-6 text-center">
          <p className="text-white text-sm mb-1">No biomes match the current filters.</p>
          <p className="text-gray-400 text-xs">Try broadening the selected layer or turning off the hardmode-only filter.</p>
        </div>
      )}
    </div>
  )
}