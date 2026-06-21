import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
  useCallback,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog')
  }
  return context
}

interface DialogProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Dialog({ children, open: controlledOpen, onOpenChange }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  return (
    <DialogContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogTriggerProps {
  children: ReactNode
  asChild?: boolean
}

export function DialogTrigger({ children }: DialogTriggerProps) {
  const { onOpenChange } = useDialogContext()

  return (
    <div onClick={() => onOpenChange(true)} className="inline-block">
      {children}
    </div>
  )
}

interface DialogContentProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function DialogContent({ children, className, size = 'md' }: DialogContentProps) {
  const { open, onOpenChange } = useDialogContext()

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    },
    [onOpenChange]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, handleEscape])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-forest/40 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Content — bottom sheet on mobile, centered modal on desktop */}
      <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          className={cn(
            'relative w-full bg-warm-white shadow-soft-lg overflow-hidden',
            'rounded-t-[24px] sm:rounded-card',
            'animate-sheet-up sm:animate-scale-in',
            'pb-[max(env(safe-area-inset-bottom),0px)] sm:pb-0',
            sizes[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grab handle (mobile only) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <span className="h-1.5 w-10 rounded-full bg-latte" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

interface DialogHeaderProps {
  children: ReactNode
  className?: string
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  const { onOpenChange } = useDialogContext()

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 sm:p-6 border-b border-latte',
        className
      )}
    >
      <div>{children}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onOpenChange(false)}
        className="h-8 w-8 -mr-2"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

interface DialogTitleProps {
  children: ReactNode
  className?: string
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2 className={cn('font-heading text-xl font-semibold text-espresso', className)}>
      {children}
    </h2>
  )
}

interface DialogDescriptionProps {
  children: ReactNode
  className?: string
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={cn('text-sm text-espresso/60 mt-1', className)}>{children}</p>
  )
}

interface DialogBodyProps {
  children: ReactNode
  className?: string
}

export function DialogBody({ children, className }: DialogBodyProps) {
  return (
    <div className={cn('p-4 sm:p-6 overflow-y-auto max-h-[60vh]', className)}>
      {children}
    </div>
  )
}

interface DialogFooterProps {
  children: ReactNode
  className?: string
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 p-4 sm:p-6 border-t border-latte',
        className
      )}
    >
      {children}
    </div>
  )
}
