import { ChefHat } from 'lucide-react'
import type { Recipe } from '@/types/recipe'
import { itemsById } from '@/data/index'

interface RecipeCardProps {
  recipe: Recipe
  onItemClick?: (itemId: number) => void
  showResult?: boolean
}

export function RecipeCard({ recipe, onItemClick, showResult }: RecipeCardProps) {
  const resultItem = itemsById.get(recipe.resultItemId)

  return (
    <div className="bg-terra-bg border border-terra-border rounded-lg p-3">
      {showResult && resultItem && (
        <button
          onClick={() => onItemClick?.(recipe.resultItemId)}
          className="text-terra-gold font-semibold text-sm mb-2 hover:underline text-left py-1"
        >
          → {resultItem.name} {recipe.resultQuantity > 1 ? `×${recipe.resultQuantity}` : ''}
        </button>
      )}

      <div className="flex items-center gap-1.5 mb-2">
        <ChefHat className="w-3.5 h-3.5 text-terra-gold shrink-0" />
        <span className="text-terra-gold text-xs font-semibold">{recipe.station}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {recipe.ingredients.map((ing) => {
          const ingItem = itemsById.get(ing.itemId)
          return (
            <button
              key={ing.itemId}
              onClick={() => onItemClick?.(ing.itemId)}
              className="flex items-center gap-1 bg-terra-surface border border-terra-border rounded px-2 py-1.5 text-xs hover:border-terra-gold transition-colors"
            >
              <span className="text-white">{ingItem?.name ?? `Item #${ing.itemId}`}</span>
              {ing.quantity > 1 && (
                <span className="text-terra-gold font-bold">×{ing.quantity}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
