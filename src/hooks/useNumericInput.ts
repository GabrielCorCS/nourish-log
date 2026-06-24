import { useCallback, useEffect, useState } from 'react'

interface Options {
  /** Allow a decimal point. When false, only whole numbers can be typed. */
  allowDecimals?: boolean
  /** Clamp to this minimum on blur. */
  min?: number
  /** Clamp to this maximum on blur. */
  max?: number
}

// An empty buffer (or a lone ".") reads as 0 but shows the placeholder, so there
// is never a stray "0" the user has to delete before typing.
function format(n: number): string {
  if (!Number.isFinite(n) || n === 0) return ''
  return String(n)
}

/**
 * Drives a free-typed numeric text input. Returns props to spread onto an
 * `<input>` (or our styled `Input`). Keeps an internal string buffer so users can
 * type arbitrary precision (e.g. "0.125") and intermediate states ("0.") without
 * the value snapping back, while reporting a parsed number to `onChange`.
 *
 * Uses `type="text"` + `inputMode="decimal"` rather than `type="number"` so the
 * browser's `step` validation can't block values finer than tenths.
 */
export function useNumericInput(
  value: number,
  onChange: (value: number) => void,
  { allowDecimals = true, min, max }: Options = {}
) {
  const [text, setText] = useState<string>(() => format(value))

  // Re-sync the buffer when the external value changes to something that doesn't
  // match what's typed (stepper +/-, reset, switching the edited item, etc.).
  // Intentionally keyed on `value` only — depending on `text` would clobber
  // in-progress typing on every keystroke.
  useEffect(() => {
    const parsed = text === '' || text === '.' ? 0 : Number(text)
    if (Number.isNaN(parsed) || parsed !== value) {
      setText(format(value))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      const pattern = allowDecimals ? /^\d*\.?\d*$/ : /^\d*$/
      if (raw !== '' && !pattern.test(raw)) return
      setText(raw)
      const parsed = raw === '' || raw === '.' ? 0 : Number(raw)
      if (!Number.isNaN(parsed)) onChange(parsed)
    },
    [allowDecimals, onChange]
  )

  const handleBlur = useCallback(() => {
    let parsed = text === '' || text === '.' ? 0 : Number(text)
    if (Number.isNaN(parsed)) parsed = 0
    if (min != null && parsed < min) parsed = min
    if (max != null && parsed > max) parsed = max
    setText(format(parsed))
    if (parsed !== value) onChange(parsed)
  }, [text, min, max, value, onChange])

  return {
    type: 'text' as const,
    inputMode: 'decimal' as const,
    value: text,
    onChange: handleChange,
    onBlur: handleBlur,
  }
}
