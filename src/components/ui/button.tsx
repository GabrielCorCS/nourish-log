import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
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
      font-medium transition-all duration-200
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `

    const variants = {
      primary: 'bg-caramel text-white hover:bg-caramel/90 active:scale-[0.98]',
      secondary: 'bg-latte/30 text-espresso hover:bg-latte/50 active:scale-[0.98]',
      ghost: 'text-espresso hover:bg-latte/30 active:scale-[0.98]',
      outline: 'border-2 border-latte text-espresso hover:bg-latte/20 active:scale-[0.98]',
      danger: 'bg-terracotta text-white hover:bg-terracotta/90 active:scale-[0.98]',
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
