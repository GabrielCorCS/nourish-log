import { Edit2, Trash2 } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { MacroPills } from '@/components/shared'
import { formatTime } from '@/lib/dates'
import { useHousehold } from '@/hooks/useHousehold'
import type { FoodEntryWithDetails } from '@/types/database'

interface MealCardProps {
  entry: FoodEntryWithDetails
  onEdit?: (entry: FoodEntryWithDetails) => void
  onDelete?: (entry: FoodEntryWithDetails) => void
}

export function MealCard({ entry, onEdit, onDelete }: MealCardProps) {
  const { data: household } = useHousehold()
  const name = entry.recipe?.name || 'Quick add'
  const emoji = entry.recipe?.emoji || '🥗'
  const loggedByOther = entry.logged_by != null && entry.logged_by !== entry.user_id
  const loggerName = loggedByOther
    ? household?.members.find((m) => m.id === entry.logged_by)?.name ?? 'partner'
    : null

  return (
    <Card variant="elevated" padding="sm" className="animate-fade-in">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-espresso truncate">{name}</h4>
              <p className="text-xs text-espresso/50">
                {formatTime(entry.logged_at)}
                {entry.servings !== 1 && ` · ${entry.servings} servings`}
                {loggerName && ` · by ${loggerName}`}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(entry)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-terracotta hover:bg-terracotta/10"
                  onClick={() => onDelete(entry)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          <MacroPills
            calories={entry.calories}
            protein={entry.protein}
            carbs={entry.carbs}
            fat={entry.fat}
            className="mt-2"
          />
          {entry.notes && (
            <p className="text-xs text-espresso/50 mt-2 italic">
              "{entry.notes}"
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
