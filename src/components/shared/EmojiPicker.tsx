import { useState } from 'react'
import { cn } from '@/lib/utils'
import { COMMON_EMOJIS } from '@/lib/constants'
import { Button } from '@/components/ui'

interface EmojiPickerProps {
  value?: string | null
  onChange: (emoji: string) => void
  className?: string
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-12 h-12 flex items-center justify-center',
          'text-2xl bg-cream border border-latte rounded-input',
          'hover:bg-latte/20 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-caramel'
        )}
      >
        {value || '🍽️'}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-20 bg-warm-white rounded-card shadow-soft-lg p-3 animate-scale-in">
            <div className="grid grid-cols-8 gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange(emoji)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center text-lg',
                    'rounded hover:bg-latte/30 transition-colors',
                    value === emoji && 'bg-caramel/20'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-latte">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                }}
                className="w-full text-sm"
              >
                Clear
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
