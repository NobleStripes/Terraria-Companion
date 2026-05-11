import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, ChevronDown, ChevronUp, Copy, Filter, Mountain, Trees } from 'lucide-react'
import { biomes, npcs } from '@/data/index'
import type { Biome } from '@/types/biome'
import { cn } from '@/lib/cn'
import { useViewport } from '@/hooks/useViewport'
import { useSearchPresets } from '@/hooks/useSearchPresets'

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

type BiomePresetFilters = {
  layer: 'all' | Biome['layer']
  hardmode: boolean
}

function BiomeCard({ biome, isMobile, isTablet }: { biome: Biome; isMobile: boolean; isTablet: boolean }) {
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
          <div className={cn('pt-3 gap-4', isMobile ? 'grid grid-cols-1' : isTablet ? 'grid grid-cols-2' : 'grid grid-cols-1 sm:grid-cols-3')}>
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
  const { isMobile, isTablet } = useViewport()
  const [searchParams, setSearchParams] = useSearchParams()
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const { presets, savePreset, renamePreset, deletePreset } = useSearchPresets<BiomePresetFilters>('terraria-biome-presets')

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

  function saveCurrentPreset() {
    const suggested = selectedLayer === 'all' ? 'All Layers' : layerLabels[selectedLayer]
    const name = window.prompt('Preset name', hardmodeOnly ? `${suggested} Hardmode` : suggested)
    if (!name) {
      return
    }

    savePreset(name, '', {
      layer: selectedLayer,
      hardmode: hardmodeOnly,
    })
  }

  function applyPreset(presetId: string) {
    const preset = presets.find((entry) => entry.id === presetId)
    if (!preset) {
      return
    }

    updateFilters({
      layer: preset.filters.layer,
      hardmode: preset.filters.hardmode,
    })
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

  const filteredBiomes = [...biomes]
    .filter((biome) => selectedLayer === 'all' || biome.layer === selectedLayer)
    .filter((biome) => !hardmodeOnly || biome.hardmodeOnly)
    .sort((left, right) => {
      const layerDiff = layerOrder[left.layer] - layerOrder[right.layer]
      if (layerDiff !== 0) return layerDiff
      return left.name.localeCompare(right.name)
    })

  const filtersVisible = !isMobile || showFiltersPanel

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

        {isMobile && (
          <button
            type="button"
            onClick={() => setShowFiltersPanel((visible) => !visible)}
            className="inline-flex items-center justify-center gap-2 rounded border border-terra-border px-3 py-2.5 min-h-11 text-xs text-gray-300 hover:border-terra-gold hover:text-white transition-colors w-full"
            aria-expanded={filtersVisible}
            aria-controls="biome-guide-filters"
          >
            <Filter className="w-3.5 h-3.5" />
            {filtersVisible ? 'Hide Filters' : 'Show Filters'}
          </button>
        )}

        {filtersVisible && (
          <div id="biome-guide-filters" className="bg-terra-surface border border-terra-border rounded-lg p-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2 min-w-0">
            <p className="text-terra-gold text-xs font-pixel">Filters</p>
            <div className={cn('flex gap-2', isMobile ? 'overflow-x-auto pb-1' : 'flex-wrap')}>
              {(['all', 'sky', 'surface', 'underground', 'cavern', 'underworld'] as const).map((layer) => (
                <button
                  key={layer}
                  type="button"
                  onClick={() => updateFilters({ layer })}
                  className={cn(
                    'px-3 py-1.5 rounded border text-xs transition-colors whitespace-nowrap',
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

          <label className="inline-flex items-center gap-2 text-xs text-gray-300 whitespace-nowrap">
            <input
              type="checkbox"
              checked={hardmodeOnly}
              onChange={(event) => updateFilters({ hardmode: event.target.checked })}
              className="accent-[var(--color-terra-gold)]"
            />
            Show only hardmode biomes
          </label>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex flex-col items-start gap-1.5">
              <button
                type="button"
                onClick={copyCurrentViewLink}
                className="inline-flex items-center gap-1.5 rounded border border-terra-border px-3 py-2.5 min-h-11 text-xs text-gray-300 hover:border-terra-gold hover:text-white transition-colors"
              >
                {copyState === 'copied' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copyState === 'copied' ? 'Link copied' : copyState === 'error' ? 'Copy failed' : 'Copy link'}
              </button>
              <p className="text-[11px] text-gray-500 leading-relaxed max-w-56">
                Shares the current layer and hardmode filters so the same biome view opens for anyone with the link.
              </p>
            </div>
          </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={saveCurrentPreset}
            className="rounded border border-terra-border px-2.5 py-1.5 text-xs text-gray-300 hover:border-terra-gold hover:text-white transition-colors"
          >
            Save Preset
          </button>
          {presets.slice(0, 5).map((preset) => (
            <div key={preset.id} className="inline-flex items-center rounded border border-terra-border bg-terra-surface">
              <button
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="px-2 py-1.5 text-xs text-gray-300 hover:text-white transition-colors"
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextName = window.prompt('Rename preset', preset.name)
                  if (nextName) renamePreset(preset.id, nextName)
                }}
                className="px-1.5 py-1.5 text-[11px] text-gray-500 hover:text-terra-gold transition-colors"
                aria-label={`Rename ${preset.name}`}
              >
                R
              </button>
              <button
                type="button"
                onClick={() => deletePreset(preset.id)}
                className="px-1.5 py-1.5 text-[11px] text-gray-500 hover:text-terra-red transition-colors"
                aria-label={`Delete ${preset.name}`}
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 text-xs text-gray-500">
        <span>{filteredBiomes.length} biome{filteredBiomes.length === 1 ? '' : 's'} shown</span>
        <span className="inline-flex items-center gap-1.5 text-gray-400">
          <Mountain className="w-3.5 h-3.5" />
          Sorted by world layer
        </span>
      </div>

      <div className={cn('grid gap-4', isTablet ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-2')}>
        {filteredBiomes.map((biome) => (
          <BiomeCard key={biome.id} biome={biome} isMobile={isMobile} isTablet={isTablet} />
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