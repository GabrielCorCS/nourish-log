import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, ScanLine, Loader2, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Input, Button, Select } from '@/components/ui'
import { useSearchIngredients, useCreateIngredient } from '@/hooks'
import { useUIStore } from '@/stores'
import { INGREDIENT_CATEGORIES, SERVING_UNITS } from '@/lib/constants'
import {
  searchProducts,
  getProductByBarcode,
  offToIngredientDraft,
  type OffProduct,
  type IngredientDraft,
} from '@/lib/openfoodfacts'
import type { Ingredient, IngredientCategory } from '@/types/database'
import { BarcodeScanner } from './BarcodeScanner'

interface IngredientSearchProps {
  onSelect: (ingredient: Ingredient) => void
  /** Optional placeholder for the search input. */
  placeholder?: string
  /** Ingredient ids already chosen, hidden from library results. */
  excludeIds?: string[]
}

const emptyDraft: IngredientDraft = {
  name: '',
  brand: null,
  category: 'condiments',
  serving_size: 100,
  serving_unit: 'g',
  serving_grams: 100,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  image_url: null,
  barcode: null,
  off_id: null,
}

// Open Food Facts text search, debounced + cached via react-query.
function useOffSearch(search: string) {
  return useQuery({
    queryKey: ['off-search', search],
    queryFn: () => searchProducts(search),
    enabled: search.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  })
}

export function IngredientSearch({
  onSelect,
  placeholder = 'Search ingredients...',
  excludeIds = [],
}: IngredientSearchProps) {
  const addToast = useUIStore((state) => state.addToast)
  const createIngredient = useCreateIngredient()

  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [lookingUpBarcode, setLookingUpBarcode] = useState(false)
  const [draft, setDraft] = useState<IngredientDraft | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const { data: libraryResults } = useSearchIngredients(search)
  const { data: offResults, isFetching: offFetching } = useOffSearch(debounced)

  const excluded = useMemo(() => new Set(excludeIds), [excludeIds])

  const visibleLibrary = (libraryResults ?? []).filter(
    (i) => !excluded.has(i.id)
  )

  const knownOffIds = useMemo(
    () =>
      new Set(
        (libraryResults ?? [])
          .flatMap((i) => [i.off_id, i.barcode])
          .filter((v): v is string => !!v)
      ),
    [libraryResults]
  )

  const visibleOff = (offResults ?? []).filter((p) => !knownOffIds.has(p.code))

  const handleSelectOff = async (product: OffProduct) => {
    try {
      const created = await createIngredient.mutateAsync(
        offToIngredientDraft(product)
      )
      addToast(`Added ${created.name} to your library`, 'success')
      onSelect(created)
      setSearch('')
    } catch {
      addToast('Could not add this product', 'error')
    }
  }

  const handleSelectLibrary = (ingredient: Ingredient) => {
    onSelect(ingredient)
    setSearch('')
  }

  const handleBarcodeDetected = async (barcode: string) => {
    setScannerOpen(false)
    setLookingUpBarcode(true)
    try {
      const product = await getProductByBarcode(barcode)
      if (product) {
        setDraft(offToIngredientDraft(product))
      } else {
        setDraft({ ...emptyDraft, barcode, off_id: barcode })
        addToast('Product not found — add it manually', 'info')
      }
    } catch {
      addToast('Could not look up that barcode', 'error')
    } finally {
      setLookingUpBarcode(false)
    }
  }

  const openAddInline = () => {
    setDraft({ ...emptyDraft, name: search.trim() })
  }

  const handleCreateDraft = async (next: IngredientDraft) => {
    try {
      const created = await createIngredient.mutateAsync(next)
      addToast(`Added ${created.name} to your library`, 'success')
      onSelect(created)
      setDraft(null)
      setSearch('')
    } catch {
      addToast('Could not create ingredient', 'error')
    }
  }

  const showResults = search.trim().length >= 1
  const hasLibrary = visibleLibrary.length > 0
  const hasOff = visibleOff.length > 0

  return (
    <div className="space-y-3">
      {/* Search bar + barcode button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={
              offFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald" />
              ) : undefined
            }
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setScannerOpen(true)}
          aria-label="Scan barcode"
          isLoading={lookingUpBarcode}
        >
          {!lookingUpBarcode && <ScanLine className="h-4 w-4" />}
        </Button>
      </div>

      {showResults && (
        <div className="space-y-3">
          {/* Library results */}
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-espresso/55">
              Your library
            </p>
            {hasLibrary ? (
              <div className="overflow-hidden rounded-[22px] bg-warm-white ring-1 ring-latte/60">
                {visibleLibrary.map((ingredient, idx) => (
                  <button
                    key={ingredient.id}
                    type="button"
                    onClick={() => handleSelectLibrary(ingredient)}
                    className={[
                      'pressable flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-cream',
                      idx > 0 ? 'border-t border-latte/40' : '',
                    ].join(' ')}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cream text-xl ring-1 ring-latte/50">
                      {ingredient.emoji || '🍽️'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-espresso">
                        {ingredient.name}
                        {ingredient.brand && (
                          <span className="font-normal text-espresso/50">
                            {' '}· {ingredient.brand}
                          </span>
                        )}
                      </p>
                      <p className="metric text-xs text-espresso/50">
                        {Math.round(ingredient.calories)} cal ·{' '}
                        {ingredient.serving_size} {ingredient.serving_unit}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 shrink-0 text-emerald" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-1 text-sm text-espresso/40">
                No matches in your library
              </p>
            )}
          </div>

          {/* Open Food Facts results */}
          {(hasOff || offFetching) && (
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-espresso/55">
                Open Food Facts
              </p>
              <div className="overflow-hidden rounded-[22px] bg-warm-white ring-1 ring-latte/60">
                {hasOff
                  ? visibleOff.map((product, idx) => (
                      <button
                        key={product.code}
                        type="button"
                        onClick={() => handleSelectOff(product)}
                        disabled={createIngredient.isPending}
                        className={[
                          'pressable flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-cream disabled:opacity-50',
                          idx > 0 ? 'border-t border-latte/40' : '',
                        ].join(' ')}
                      >
                        {product.image_small_url ? (
                          <img
                            src={product.image_small_url}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-latte/40"
                          />
                        ) : (
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cream text-xl ring-1 ring-latte/50">
                            🛒
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-espresso">
                            {product.product_name}
                            {product.brands && (
                              <span className="font-normal text-espresso/50">
                                {' '}· {product.brands}
                              </span>
                            )}
                          </p>
                          <p className="metric text-xs text-espresso/50">
                            {Math.round(
                              product.nutriments?.['energy-kcal_100g'] ?? 0
                            )}{' '}
                            cal / 100g
                          </p>
                        </div>
                        <Plus className="h-4 w-4 shrink-0 text-emerald" />
                      </button>
                    ))
                  : (
                      <p className="px-4 py-3 text-sm text-espresso/40">
                        Searching Open Food Facts…
                      </p>
                    )}
              </div>
            </div>
          )}

          {/* Add manually */}
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openAddInline}
          >
            Add &ldquo;{search.trim() || 'new ingredient'}&rdquo; manually
          </Button>
        </div>
      )}

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      />

      {draft && (
        <AddIngredientInline
          draft={draft}
          isSaving={createIngredient.isPending}
          onCancel={() => setDraft(null)}
          onSubmit={handleCreateDraft}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compact inline "add new ingredient" form.
// ---------------------------------------------------------------------------
interface AddIngredientInlineProps {
  draft: IngredientDraft
  isSaving: boolean
  onCancel: () => void
  onSubmit: (draft: IngredientDraft) => void
}

function AddIngredientInline({
  draft,
  isSaving,
  onCancel,
  onSubmit,
}: AddIngredientInlineProps) {
  const [form, setForm] = useState<IngredientDraft>(draft)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(draft)
    setError(null)
  }, [draft])

  const set = <K extends keyof IngredientDraft>(
    key: K,
    value: IngredientDraft[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name?.trim()) {
      setError('Name is required')
      return
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      brand: form.brand?.trim() || null,
      serving_grams:
        form.serving_unit === 'g' || form.serving_unit === 'ml'
          ? form.serving_size
          : form.serving_grams ?? null,
    })
  }

  return (
    <div className="rounded-[22px] bg-warm-white p-5 ring-1 ring-latte/60">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-display font-semibold text-espresso">
          New ingredient
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {form.image_url && (
          <img
            src={form.image_url}
            alt=""
            className="h-16 w-16 rounded-xl object-cover ring-1 ring-latte/50"
          />
        )}

        <Input
          label="Name"
          value={form.name ?? ''}
          onChange={(e) => set('name', e.target.value)}
          error={error ?? undefined}
          placeholder="e.g., Chicken Breast"
        />

        <Input
          label="Brand (optional)"
          value={form.brand ?? ''}
          onChange={(e) => set('brand', e.target.value)}
          placeholder="e.g., Trader Joe's"
        />

        <Select
          label="Category"
          value={form.category}
          onChange={(e) =>
            set('category', e.target.value as IngredientCategory)
          }
          options={INGREDIENT_CATEGORIES.map((c) => ({
            value: c.value,
            label: `${c.emoji} ${c.label}`,
          }))}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Serving"
            type="number"
            value={form.serving_size}
            onChange={(e) => set('serving_size', Number(e.target.value))}
            min={0}
            step={0.1}
          />
          <Select
            label="Unit"
            value={form.serving_unit}
            onChange={(e) => set('serving_unit', e.target.value)}
            options={SERVING_UNITS.map((u) => ({ value: u, label: u }))}
          />
          <Input
            label="g / serving"
            type="number"
            value={form.serving_grams ?? ''}
            onChange={(e) =>
              set(
                'serving_grams',
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
            min={0}
            step={0.1}
            hint="for g/ml entry"
          />
        </div>

        <div className="border-t border-latte pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-espresso/55">
            Nutrition per serving
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Calories"
              type="number"
              value={form.calories}
              onChange={(e) => set('calories', Number(e.target.value))}
              min={0}
            />
            <Input
              label="Protein (g)"
              type="number"
              value={form.protein}
              onChange={(e) => set('protein', Number(e.target.value))}
              min={0}
              step={0.1}
            />
            <Input
              label="Carbs (g)"
              type="number"
              value={form.carbs}
              onChange={(e) => set('carbs', Number(e.target.value))}
              min={0}
              step={0.1}
            />
            <Input
              label="Fat (g)"
              type="number"
              value={form.fat}
              onChange={(e) => set('fat', Number(e.target.value))}
              min={0}
              step={0.1}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Add to library
          </Button>
        </div>
      </form>
    </div>
  )
}
