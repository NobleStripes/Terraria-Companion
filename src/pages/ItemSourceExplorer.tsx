import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { SearchBar } from '@/components/ui/SearchBar'
import { ItemCard } from '@/components/ui/ItemCard'
import { items } from '@/data/index'
import { getItemSourceCategory, getItemSourceFacets, type SourceCategory } from '@/lib/itemSources'

const categories: Array<{ value: SourceCategory; label: string }> = [
  { value: 'all', label: 'All Sources' },
  { value: 'crafted', label: 'Crafted' },
  { value: 'drop', label: 'Drops' },
  { value: 'vendor', label: 'Vendors' },
  { value: 'event', label: 'Events' },
  { value: 'exploration', label: 'Exploration' },
]

function isSourceCategory(value: string | null): value is SourceCategory {
  return value === 'all' || value === 'crafted' || value === 'drop' || value === 'vendor' || value === 'event' || value === 'exploration'
}

export default function ItemSourceExplorer() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCategory = isSourceCategory(searchParams.get('category')) ? searchParams.get('category') : 'all'
  const selectedFacet = searchParams.get('facet') ?? ''
  const query = searchParams.get('q') ?? ''

  const facetCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const item of items) {
      if (selectedCategory !== 'all' && getItemSourceCategory(item) !== selectedCategory) {
        continue
      }

      for (const facet of getItemSourceFacets(item)) {
        counts.set(facet, (counts.get(facet) ?? 0) + 1)
      }
    }

    return Array.from(counts.entries())
      .map(([facet, count]) => ({ facet, count }))
      .sort((a, b) => b.count - a.count || a.facet.localeCompare(b.facet))
  }, [selectedCategory])

  const displayItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((item) => {
      if (selectedCategory !== 'all' && getItemSourceCategory(item) !== selectedCategory) {
        return false
      }

      const facets = getItemSourceFacets(item)
      if (selectedFacet && !facets.includes(selectedFacet)) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const haystack = `${item.name} ${item.tooltip} ${facets.join(' ')}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [query, selectedCategory, selectedFacet])

  function setCategory(category: SourceCategory) {
    const next = new URLSearchParams(searchParams)
    if (category === 'all') {
      next.delete('category')
    } else {
      next.set('category', category)
    }
    next.delete('facet')
    setSearchParams(next, { replace: true })
  }

  function setFacet(facet: string) {
    const next = new URLSearchParams(searchParams)
    if (!facet) {
      next.delete('facet')
    } else {
      next.set('facet', facet)
    }
    setSearchParams(next, { replace: true })
  }

  function setQuery(nextQuery: string) {
    const next = new URLSearchParams(searchParams)
    if (nextQuery.trim()) {
      next.set('q', nextQuery)
    } else {
      next.delete('q')
    }
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="font-pixel text-terra-gold text-sm">Item Source Explorer</h1>
        <p className="text-xs text-gray-400 mt-1">Browse items by acquisition path first, then jump to full item details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <aside className="bg-terra-surface border border-terra-border rounded-lg p-4 space-y-3">
          <SearchBar value={query} onChange={setQuery} placeholder="Search source facets or item names…" />

          <div className="space-y-2">
            <h2 className="text-terra-gold text-xs font-pixel">Source Category</h2>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => {
                const active = selectedCategory === category.value
                return (
                  <button
                    key={category.value}
                    onClick={() => setCategory(category.value)}
                    className={`rounded border px-2 py-2 text-xs transition-colors ${
                      active
                        ? 'border-terra-gold bg-terra-panel text-terra-gold'
                        : 'border-terra-border text-gray-300 hover:border-terra-gold hover:text-white'
                    }`}
                  >
                    {category.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-terra-gold text-xs font-pixel">Source Facet</h2>
              {selectedFacet && (
                <button
                  onClick={() => setFacet('')}
                  className="text-[11px] text-gray-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1">
              {facetCounts.length === 0 && (
                <p className="text-xs text-gray-500">No source facets found for this category.</p>
              )}
              {facetCounts.slice(0, 60).map((entry) => {
                const active = selectedFacet === entry.facet
                return (
                  <button
                    key={entry.facet}
                    onClick={() => setFacet(active ? '' : entry.facet)}
                    className={`w-full text-left rounded border px-2 py-1.5 text-xs transition-colors ${
                      active
                        ? 'border-terra-gold bg-terra-panel text-terra-gold'
                        : 'border-terra-border text-gray-300 hover:border-terra-gold hover:text-white'
                    }`}
                  >
                    <span>{entry.facet}</span>
                    <span className="float-right text-gray-500">{entry.count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <section className="bg-terra-surface border border-terra-border rounded-lg p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-terra-gold text-xs font-pixel">Matching Items ({displayItems.length})</h2>
            <Link to="/items" className="text-xs text-terra-sky hover:text-terra-gold transition-colors">
              Open full Item Lookup
            </Link>
          </div>

          {displayItems.length === 0 ? (
            <p className="text-sm text-gray-500">No items match the selected source filters.</p>
          ) : (
            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
              {displayItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  selected={false}
                  onClick={() => navigate(`/items/${item.id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
