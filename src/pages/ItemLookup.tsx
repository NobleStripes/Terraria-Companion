import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ExternalLink, Package } from 'lucide-react'
import { SearchBar } from '@/components/ui/SearchBar'
import { ItemCard } from '@/components/ui/ItemCard'
import { RecipeCard } from '@/components/ui/RecipeCard'
import { RarityBadge, TypeBadge } from '@/components/ui/Badge'
import { useItemSearch } from '@/hooks/useItemSearch'
import { useRecipesForItem } from '@/hooks/useRecipes'
import { itemsById, items } from '@/data/index'
import type { Item } from '@/types/item'

const RECENT_COUNT = 20

function ItemDetailPanel({
  item,
  onItemClick,
}: {
  item: Item
  onItemClick: (itemId: number) => void
}) {
  const { crafts, usedIn } = useRecipesForItem(item.id)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-1">{item.name}</h2>
        <div className="flex items-center gap-2 mb-3">
          <RarityBadge rarity={item.rarity} />
          <TypeBadge type={item.type} />
        </div>
        <p className="text-gray-300 text-sm italic leading-relaxed">{item.tooltip}</p>
      </div>

      {item.sources.length > 0 && (
        <div>
          <h3 className="text-terra-gold text-xs font-pixel mb-2">Sources</h3>
          <ul className="space-y-1">
            {item.sources.map((source) => (
              <li key={source} className="text-gray-300 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-terra-gold rounded-full shrink-0" />
                {source}
              </li>
            ))}
          </ul>
        </div>
      )}

      {crafts.length > 0 && (
        <div>
          <h3 className="text-terra-gold text-xs font-pixel mb-2">
            Crafted With ({crafts.length})
          </h3>
          <div className="space-y-2">
            {crafts.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onItemClick={onItemClick} />
            ))}
          </div>
        </div>
      )}

      {usedIn.length > 0 && (
        <div>
          <h3 className="text-terra-gold text-xs font-pixel mb-2">
            Used In ({usedIn.length})
          </h3>
          <div className="space-y-2">
            {usedIn.map((recipe) => {
              const resultItem = itemsById.get(recipe.resultItemId)
              return (
                <div key={recipe.id} className="bg-terra-bg border border-terra-border rounded-lg p-3">
                  <button
                    onClick={() => onItemClick(recipe.resultItemId)}
                    className="text-sm font-semibold text-terra-sky hover:text-terra-gold transition-colors mb-1 text-left"
                  >
                    → {resultItem?.name ?? `Item #${recipe.resultItemId}`}
                    {recipe.resultQuantity > 1 ? ` ×${recipe.resultQuantity}` : ''}
                  </button>
                  <div className="text-xs text-gray-500">at {recipe.station}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {item.wikiSlug && (
        <a
          href={`https://terraria.wiki.gg/wiki/${item.wikiSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-terra-sky hover:text-terra-gold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View on Wiki
        </a>
      )}
    </div>
  )
}

export default function ItemLookup() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | undefined>(
    itemId ? parseInt(itemId, 10) : undefined
  )
  const listRef = useRef<HTMLDivElement>(null)

  const searchResults = useItemSearch(query)
  const displayItems = query.trim().length >= 2
    ? searchResults.map((r) => r.item)
    : items.slice(0, RECENT_COUNT)

  const selectedItem = selectedId !== undefined ? itemsById.get(selectedId) : undefined

  const selectItem = useCallback(
    (id: number) => {
      setSelectedId(id)
      navigate(`/items/${id}`, { replace: true })
    },
    [navigate]
  )

  useEffect(() => {
    if (itemId) setSelectedId(parseInt(itemId, 10))
  }, [itemId])

  // keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>('input[type="text"]')
        input?.focus()
      }
      if (!displayItems.length) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const idx = displayItems.findIndex((i) => i.id === selectedId)
        const next = e.key === 'ArrowDown'
          ? Math.min(idx + 1, displayItems.length - 1)
          : Math.max(idx - 1, 0)
        selectItem(displayItems[next].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [displayItems, selectedId, selectItem])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="font-pixel text-terra-gold text-sm">Item Lookup</h1>

      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-160px)]">
        {/* Left panel */}
        <div className="md:w-72 lg:w-80 flex flex-col gap-3 shrink-0">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search items… (press /)"
            autoFocus
          />

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto space-y-1.5 pr-1"
          >
            {displayItems.length === 0 && query.trim().length >= 2 && (
              <p className="text-gray-500 text-sm text-center py-8">No items found.</p>
            )}
            {displayItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onClick={() => selectItem(item.id)}
              />
            ))}
          </div>

          {!query && (
            <p className="text-gray-600 text-xs text-center">
              Showing {RECENT_COUNT} of {items.length} items. Type to search.
            </p>
          )}
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-terra-surface border border-terra-border rounded-lg p-5 overflow-y-auto">
          {selectedItem ? (
            <ItemDetailPanel item={selectedItem} onItemClick={selectItem} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Package className="w-12 h-12 text-terra-border mb-3" />
              <p className="text-gray-500 text-sm">Select an item to see details</p>
              <p className="text-gray-600 text-xs mt-1">Use / to focus search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
