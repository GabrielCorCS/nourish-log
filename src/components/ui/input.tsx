import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-espresso mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 px-3 rounded-input',
              'bg-cream border border-latte',
              'text-espresso placeholder:text-espresso/40',
              'focus:outline-none focus:ring-2 focus:ring-caramel focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-terracotta focus:ring-terracotta',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-terracotta">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-sm text-espresso/50">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || props.name

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-espresso mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-3 py-2 rounded-input min-h-[80px] resize-y',
            'bg-cream border border-latte',
            'text-espresso placeholder:text-espresso/40',
            'focus:outline-none focus:ring-2 focus:ring-caramel focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            error && 'border-terracotta focus:ring-terracotta',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-terracotta">{error}</p>}
        {hint && !error && (
          <p className="mt-1 text-sm text-espresso/50">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
