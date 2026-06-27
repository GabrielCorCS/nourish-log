import { supabase } from '@/integrations/supabase/client'

export interface AIMealItem {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface AIMealResult {
  title: string
  emoji: string
  items: AIMealItem[]
}

export interface AIMealTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function sumItems(items: AIMealItem[]): AIMealTotals {
  return items.reduce(
    (acc, i) => ({
      calories: acc.calories + (i.calories || 0),
      protein: acc.protein + (i.protein || 0),
      carbs: acc.carbs + (i.carbs || 0),
      fat: acc.fat + (i.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

export class AINotConfiguredError extends Error {}

/**
 * Asks the `ai-parse-meal` edge function to turn a free-text meal description
 * into structured items with estimated macros. Throws AINotConfiguredError when
 * the ANTHROPIC_API_KEY secret hasn't been set, so the UI can show a setup hint.
 */
export async function parseMeal(description: string): Promise<AIMealResult> {
  const { data, error } = await supabase.functions.invoke('ai-parse-meal', {
    body: { description },
  })
  if (error) throw error
  if (data?.error === 'not_configured') throw new AINotConfiguredError()
  if (data?.error) throw new Error(data.error)
  return data as AIMealResult
}
