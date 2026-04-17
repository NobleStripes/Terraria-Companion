export interface RecipeIngredient {
  itemId: number
  quantity: number
}

export interface Recipe {
  id: number
  resultItemId: number
  resultQuantity: number
  ingredients: RecipeIngredient[]
  station: string
}
