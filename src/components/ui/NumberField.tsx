import { forwardRef } from 'react'
import { Input, type InputProps } from './Input'
import { useNumericInput } from '@/hooks/useNumericInput'

export interface NumberFieldProps
  extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'min' | 'max' | 'step'> {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** Allow a decimal point (default true). */
  allowDecimals?: boolean
}

/**
 * A number input that lets users type freely:
 *  - shows the placeholder instead of a literal "0" they'd have to delete first
 *  - accepts arbitrary decimal precision (not capped at tenths like `step`)
 *  - reports a parsed `number` to `onChange`
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  (
    { value, onChange, min, max, allowDecimals = true, placeholder = '0', ...props },
    ref
  ) => {
    const inputProps = useNumericInput(value, onChange, { allowDecimals, min, max })
    return <Input ref={ref} placeholder={placeholder} {...props} {...inputProps} />
  }
)

NumberField.displayName = 'NumberField'
