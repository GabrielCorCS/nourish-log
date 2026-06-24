import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold transition-all duration-200 ease-spring
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-cream
      disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
      select-none
    `

    const variants = {
      primary:
        'bg-gradient-to-b from-emerald to-emerald-dark text-white shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
      // High-visibility CTA. Warm orange pops against the all-green UI so the
      // primary "Add / Log / New" actions are easy to spot on every page.
      accent:
        'bg-gradient-to-b from-[#FB923C] to-citrus text-white shadow-[0_6px_20px_-4px_rgba(249,115,22,0.55)] hover:shadow-[0_10px_28px_-6px_rgba(249,115,22,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
      secondary:
        'bg-sage/15 text-emerald-dark hover:bg-sage/25 active:scale-[0.98]',
      ghost:
        'text-espresso hover:bg-sage/12 active:scale-[0.97]',
      outline:
        'border border-latte text-espresso hover:border-emerald/50 hover:bg-sage/10 active:scale-[0.98]',
      danger:
        'bg-terracotta text-white shadow-soft hover:bg-terracotta/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-button',
      md: 'h-10 px-4 text-sm rounded-button',
      lg: 'h-12 px-6 text-base rounded-button',
      icon: 'h-10 w-10 rounded-button',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
