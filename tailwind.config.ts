import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Garden Fresh palette ---
        // Legacy token names are kept but remapped so the whole app reskins
        // coherently without touching every component. Roles are preserved:
        //   cream = app background, warm-white = surface, latte = border/muted,
        //   espresso = primary ink, caramel = primary accent.
        cream: '#F1FBF4',        // mint white (app bg)
        'warm-white': '#FFFFFF', // clean surface
        latte: '#D6E8D8',        // soft green-gray (borders/muted)
        espresso: '#14331F',     // forest (primary text)
        caramel: '#16A34A',      // emerald (primary accent)
        sage: '#22A559',         // emerald-green (protein / secondary)
        blush: '#F472A6',        // rose (fat)
        honey: '#F2B53B',        // amber (carbs)
        terracotta: '#F97316',   // citrus orange (calories / highlight)

        // --- New brand-semantic tokens (for the login + new surfaces) ---
        forest: '#14331F',
        emerald: '#16A34A',
        'emerald-dark': '#0F7A38',
        lime: '#84CC16',
        citrus: '#F97316',
        mint: '#F1FBF4',
      },
      fontFamily: {
        // Fraunces (soft old-style serif) for display warmth; Inter for crisp UI/data.
        heading: ['Fraunces', 'Georgia', 'serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Editorial display steps (merged with Tailwind defaults via `extend`)
        'display': ['clamp(2.1rem, 7vw, 2.85rem)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        'title': ['1.5rem', { lineHeight: '1.15', letterSpacing: '-0.012em' }],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'input': '8px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(16, 80, 40, 0.08)',
        'soft-lg': '0 8px 30px rgba(16, 80, 40, 0.12)',
        'glow': '0 10px 40px rgba(22, 163, 74, 0.35)',
      },
      transitionTimingFunction: {
        // easeOutExpo — confident, decelerating settle
        'spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
        // gentle overshoot for playful pops
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ring-fill': 'ringFill 1s ease-out forwards',
        'enter': 'enter 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop': 'pop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'sheet-up': 'sheetUp 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'shimmer': 'shimmer 1.6s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        ringFill: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: 'var(--ring-offset, 0)' },
        },
        enter: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        sheetUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
