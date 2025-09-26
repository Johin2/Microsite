/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx,mdx}',
    './components/**/*.{ts,tsx,js,jsx,mdx}',
    './lib/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f5f5f5',
          foreground: '#111216'
        },
        accent: {
          DEFAULT: '#e5e7eb',
          muted: '#f4f4f5'
        },
        success: '#16a34a',
        warning: '#f59e0b',
        danger: '#dc2626'
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        aurora:
          'radial-gradient(circle at 22% 24%, rgba(245,245,245,0.18), transparent 60%), radial-gradient(circle at 78% 12%, rgba(148,163,184,0.22), transparent 55%), radial-gradient(circle at 52% 82%, rgba(100,116,139,0.18), transparent 58%)'
      },
      boxShadow: {
        glow: '0 0 40px rgba(15, 16, 20, 0.45)'
      },
      keyframes: {
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'fade-in-up': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' }
        }
      },
      animation: {
        'float-slow': 'float-slow 16s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out both',
        shimmer: 'shimmer 3.5s linear infinite'
      }
    }
  },
  plugins: []
}

module.exports = config
