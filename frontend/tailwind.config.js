/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cfjj-navy': '#162447',
        'cfjj-deep-blue': '#1E3A68',
        'cfjj-blue': '#4F8FCF',
        'cfjj-soft-sky': '#A9CBEA',
        'cfjj-bg': '#F7F9FC',
        'cfjj-surface': '#FFFFFF',
        'cfjj-muted': '#EEF3F8',
        'cfjj-border': '#D6E0EA',
        'cfjj-text-primary': '#15202B',
        'cfjj-text-secondary': '#4B5B6B',
        'cfjj-orange': '#D97745',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
