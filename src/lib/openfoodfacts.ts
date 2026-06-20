// Open Food Facts client (free, no API key, browser fetch).
// Maps OFF products to our ingredient model PER 100g so the rest of the app can
// treat them like any household ingredient. Resilient to network/JSON errors.
import type { IngredientCategory, IngredientInsert } from '@/types/database'

const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product'
const FIELDS = 'code,product_name,brands,image_small_url,nutriments,categories_tags'

export interface OffNutriments {
  'energy-kcal_100g'?: number
  proteins_100g?: number
  carbohydrates_100g?: number
  fat_100g?: number
  [key: string]: number | undefined
}

export interface OffProduct {
  code: string
  product_name?: string
  brands?: string
  image_small_url?: string
  nutriments?: OffNutriments
  categories_tags?: string[]
}

// A draft ingredient ready to be created in the household library.
// Shaped to match what useCreateIngredient accepts (it injects user/household).
export type IngredientDraft = Omit<
  IngredientInsert,
  'user_id' | 'household_id' | 'id' | 'created_at' | 'updated_at' | 'is_default'
>

interface OffSearchResponse {
  products?: OffProduct[]
}

interface OffProductResponse {
  status?: number
  product?: OffProduct
}

// Best-effort mapping of OFF category tags to our ingredient_category enum.
// Keys are substrings we look for inside the (lowercased) category tags.
const CATEGORY_TAG_MAP: { match: string; category: IngredientCategory }[] = [
  { match: 'beverage', category: 'beverages' },
  { match: 'drink', category: 'beverages' },
  { match: 'water', category: 'beverages' },
  { match: 'juice', category: 'beverages' },
  { match: 'soda', category: 'beverages' },
  { match: 'dairy', category: 'dairy' },
  { match: 'milk', category: 'dairy' },
  { match: 'cheese', category: 'dairy' },
  { match: 'yogurt', category: 'dairy' },
  { match: 'yoghurt', category: 'dairy' },
  { match: 'meat', category: 'proteins' },
  { match: 'poultry', category: 'proteins' },
  { match: 'fish', category: 'proteins' },
  { match: 'seafood', category: 'proteins' },
  { match: 'egg', category: 'proteins' },
  { match: 'legume', category: 'legumes' },
  { match: 'bean', category: 'legumes' },
  { match: 'lentil', category: 'legumes' },
  { match: 'nut', category: 'nuts' },
  { match: 'seed', category: 'nuts' },
  { match: 'fruit', category: 'fruits' },
  { match: 'vegetable', category: 'vegetables' },
  { match: 'cereal', category: 'grains' },
  { match: 'grain', category: 'grains' },
  { match: 'bread', category: 'grains' },
  { match: 'pasta', category: 'grains' },
  { match: 'rice', category: 'grains' },
  { match: 'oil', category: 'fats' },
  { match: 'fat', category: 'fats' },
  { match: 'butter', category: 'fats' },
  { match: 'sauce', category: 'condiments' },
  { match: 'condiment', category: 'condiments' },
  { match: 'spread', category: 'condiments' },
]

function mapCategory(tags?: string[]): IngredientCategory {
  if (tags) {
    for (const tag of tags) {
      const lower = tag.toLowerCase()
      const hit = CATEGORY_TAG_MAP.find((c) => lower.includes(c.match))
      if (hit) return hit.category
    }
  }
  return 'condiments'
}

// Coerce a possibly-missing/odd nutriment value into a non-negative number.
function num(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 0
}

export async function searchProducts(query: string): Promise<OffProduct[]> {
  const q = query.trim()
  if (!q) return []

  try {
    const params = new URLSearchParams({
      search_terms: q,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20',
      fields: FIELDS,
    })
    const res = await fetch(`${SEARCH_URL}?${params.toString()}`)
    if (!res.ok) return []
    const data = (await res.json()) as OffSearchResponse
    return (data.products ?? []).filter((p) => p.code && p.product_name)
  } catch {
    return []
  }
}

export async function getProductByBarcode(
  barcode: string
): Promise<OffProduct | null> {
  const code = barcode.trim()
  if (!code) return null

  try {
    const res = await fetch(
      `${PRODUCT_URL}/${encodeURIComponent(code)}.json?fields=${FIELDS}`
    )
    if (!res.ok) return null
    const data = (await res.json()) as OffProductResponse
    if (data.status === 0 || !data.product) return null
    return data.product
  } catch {
    return null
  }
}

// Map an OFF product to a household-ingredient draft, PER 100g.
export function offToIngredientDraft(p: OffProduct): IngredientDraft {
  const n = p.nutriments ?? {}
  return {
    name: p.product_name?.trim() || 'Unnamed product',
    brand: p.brands?.trim() || null,
    category: mapCategory(p.categories_tags),
    serving_size: 100,
    serving_unit: 'g',
    serving_grams: 100,
    calories: num(n['energy-kcal_100g']),
    protein: num(n.proteins_100g),
    carbs: num(n.carbohydrates_100g),
    fat: num(n.fat_100g),
    image_url: p.image_small_url?.trim() || null,
    barcode: p.code,
    off_id: p.code,
  }
}
