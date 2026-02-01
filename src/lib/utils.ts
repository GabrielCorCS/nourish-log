// Simple clsx implementation
type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassValue[]
  | { [key: string]: boolean | undefined | null }

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === 'string') {
      classes.push(input)
    } else if (Array.isArray(input)) {
      classes.push(clsx(...input))
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key)
      }
    }
  }

  return classes.join(' ')
}

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

// Format number with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(Math.round(num))
}

// Format macros (round to 1 decimal for display)
export function formatMacro(num: number): string {
  return num.toFixed(1).replace(/\.0$/, '')
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.min(100, Math.round((value / total) * 100))
}

// Pluralize word
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`)
}

// Generate unique ID
export function generateId(): string {
  return crypto.randomUUID()
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Truncate string
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
