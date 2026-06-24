import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Search, Plus, ScanLine, Loader2, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Input, Button, NumberField, Select } from '@/components/ui'
import { useSearchIngredients, useCreateIngredient } from '@/hooks'
import { useUIStore } from '@/stores'
import { cn } from '@/lib/utils'
import { INGREDIENT_CATEGORIES, SERVING_UNITS } from '@/lib/constants'
import {
  searchProducts,
  getProductByBarcode,
  offToIngredientDraft,
  type OffProduct,
  type IngredientDraft,
} from '@/lib/openfoodfacts'
import type { Ingredient, IngredientCategory } from '@/types/database'

// Lazily loaded so the heavy @zxing/browser barcode bundle only downloads when
// the user actually opens the scanner.
const BarcodeScanner = lazy(() =>
  import('./BarcodeScanner').then((m) => ({ default: m.BarcodeScanner }))
)

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

// Open Food Facts text search, debounced + cached via react-query. Only runs
// when the "Discover" tab is active so external results never load (or get
// clicked) unless the user deliberately asks for them.
function useOffSearch(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ['off-search', search],
    queryFn: () => searchProducts(search),
    enabled: enabled && search.trim().length >= 2,
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
  // Which result source is shown. Defaults to the user's own library so the
  // external suggestions are never an accidental tap away.
  const [resultTab, setResultTab] = useState<'library' | 'discover'>('library')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const { data: libraryResults } = useSearchIngredients(search)
  const { data: offResults, isFetching: offFetching } = useOffSearch(
    debounced,
    resultTab === 'discover'
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
    // A fresh query always lands on the library tab.
    setResultTab('library')
  }

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
            onChange={(e) => handleSearchChange(e.target.value)}
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
          {/* Source tabs — keep your own library separate from external
              suggestions so curated items are only shown on request. */}
          <div className="flex gap-1 rounded-full bg-cream p-1 ring-1 ring-latte/50">
            <button
              type="button"
              onClick={() => setResultTab('library')}
              className={cn(
                'flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                resultTab === 'library'
                  ? 'bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60'
                  : 'text-espresso/55 hover:text-espresso'
              )}
            >
              Your library{hasLibrary ? ` · ${visibleLibrary.length}` : ''}
            </button>
            <button
              type="button"
              onClick={() => setResultTab('discover')}
              className={cn(
                'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                resultTab === 'discover'
                  ? 'bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60'
                  : 'text-espresso/55 hover:text-espresso'
              )}
            >
              Discover
              {offFetching && (
                <Loader2 className="h-3 w-3 animate-spin text-emerald" />
              )}
            </button>
          </div>

          {/* Library results */}
          {resultTab === 'library' &&
            (hasLibrary ? (
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
              <p className="px-1 py-3 text-sm text-espresso/40">
                No matches in your library. Check{' '}
                <span className="font-medium text-espresso/60">Discover</span> or
                add it manually below.
              </p>
            ))}

          {/* Open Food Facts results — only when explicitly opened */}
          {resultTab === 'discover' && (
            <div>
              <p className="mb-1.5 px-1 text-xs text-espresso/45">
                Suggestions from Open Food Facts. Tapping one adds it to your
                library.
              </p>
              <div className="overflow-hidden rounded-[22px] bg-warm-white ring-1 ring-latte/60">
                {hasOff ? (
                  visibleOff.map((product, idx) => (
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
                          width={36}
                          height={36}
                          loading="lazy"
                          decoding="async"
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
                ) : (
                  <p className="px-4 py-3 text-sm text-espresso/40">
                    {offFetching
                      ? 'Searching Open Food Facts…'
                      : 'No suggestions found.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Add manually — available from either tab */}
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

      {scannerOpen && (
        <Suspense fallback={null}>
          <BarcodeScanner
            open
            onClose={() => setScannerOpen(false)}
            onDetected={handleBarcodeDetected}
          />
        </Suspense>
      )}

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
            width={64}
            height={64}
            loading="lazy"
            decoding="async"
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
          <NumberField
            label="Serving"
            value={form.serving_size ?? 0}
            onChange={(v) => set('serving_size', v)}
            min={0}
          />
          <Select
            label="Unit"
            value={form.serving_unit}
            onChange={(e) => set('serving_unit', e.target.value)}
            options={SERVING_UNITS.map((u) => ({ value: u, label: u }))}
          />
          <NumberField
            label="g / serving"
            value={form.serving_grams ?? 0}
            onChange={(v) => set('serving_grams', v === 0 ? null : v)}
            min={0}
            hint="for g/ml entry"
          />
        </div>

        <div className="border-t border-latte pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-espresso/55">
            Nutrition per serving
          </p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Calories"
              value={form.calories ?? 0}
              onChange={(v) => set('calories', v)}
              min={0}
            />
            <NumberField
              label="Protein (g)"
              value={form.protein ?? 0}
              onChange={(v) => set('protein', v)}
              min={0}
            />
            <NumberField
              label="Carbs (g)"
              value={form.carbs ?? 0}
              onChange={(v) => set('carbs', v)}
              min={0}
            />
            <NumberField
              label="Fat (g)"
              value={form.fat ?? 0}
              onChange={(v) => set('fat', v)}
              min={0}
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
