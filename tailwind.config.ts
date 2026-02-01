import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        'warm-white': '#FFFEF9',
        latte: '#D4C4B0',
        espresso: '#3D3024',
        caramel: '#C4956A',
        sage: '#A8B5A0',
        blush: '#E8C4C4',
        honey: '#E8D4A8',
        terracotta: '#C8846C',
      },
      fontFamily: {
        heading: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'input': '8px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(61, 48, 36, 0.08)',
        'soft-lg': '0 8px 30px rgba(61, 48, 36, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'ring-fill': 'ringFill 1s ease-out forwards',
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
      },
    },
  },
  plugins: [],
} satisfies Config
