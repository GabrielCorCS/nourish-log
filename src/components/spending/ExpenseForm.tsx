import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  Button,
  Input,
  NumberField,
} from '@/components/ui'
import { CardPicker } from './CardPicker'
import { useStores, useFindOrCreateStore, useCreateGroceryPurchase } from '@/hooks'
import { useUIStore } from '@/stores'
import type { SpendingKind } from '@/lib/constants'

interface ExpenseFormProps {
  kind: SpendingKind
  onClose: () => void
}

// One ledger entry — every field is required. Used for both grocery purchases
// and non-grocery expenses (the `kind` scopes the store list + the saved row).
export function ExpenseForm({ kind, onClose }: ExpenseFormProps) {
  const addToast = useUIStore((s) => s.addToast)
  const { data: stores } = useStores()
  const findOrCreateStore = useFindOrCreateStore()
  const createPurchase = useCreateGroceryPurchase()

  const [form, setForm] = useState({
    storeName: '',
    amount: 0,
    purchased_at: new Date().toISOString().split('T')[0],
    memo: '',
    card: null as string | null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const storeOptions = (stores ?? []).filter((s) => (s.kind ?? 'grocery') === kind)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.storeName.trim()) e.storeName = 'Store is required'
    if (!form.amount || form.amount <= 0) e.amount = 'Amount is required'
    if (!form.purchased_at) e.purchased_at = 'Date is required'
    if (!form.memo.trim()) e.memo = 'Memo is required'
    if (!form.card) e.card = 'Please select a card'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    try {
      const store_id = await findOrCreateStore(form.storeName, kind)
      await createPurchase.mutateAsync({
        kind,
        store_id,
        price: form.amount,
        purchased_at: new Date(form.purchased_at).toISOString(),
        notes: form.memo.trim(),
        card: form.card,
      })
      addToast(kind === 'grocery' ? 'Grocery purchase logged' : 'Expense logged', 'success')
      onClose()
    } catch {
      addToast('Failed to log expense', 'error')
    }
  }

  const title = kind === 'grocery' ? 'Log grocery purchase' : 'Log expense'
  const datalistId = `expense-store-${kind}`

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div>
              <Input
                label={kind === 'grocery' ? 'Grocery store' : 'Store'}
                list={datalistId}
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                error={errors.storeName}
                placeholder="Type or pick a store"
              />
              <datalist id={datalistId}>
                {storeOptions.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Amount ($)"
                value={form.amount}
                onChange={(v) => setForm({ ...form, amount: v })}
                error={errors.amount}
                min={0}
              />
              <Input
                label="Date"
                type="date"
                value={form.purchased_at}
                onChange={(e) => setForm({ ...form, purchased_at: e.target.value })}
                error={errors.purchased_at}
              />
            </div>

            <Input
              label="Memo"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              error={errors.memo}
              placeholder={kind === 'grocery' ? 'e.g., Weekly groceries' : 'e.g., Gas'}
            />

            <CardPicker
              value={form.card}
              onChange={(card) => setForm({ ...form, card })}
              error={errors.card}
            />
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createPurchase.isPending}>
              Log
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
