/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-nexus-success',
    'bg-nexus-danger',
    'bg-nexus-warning',
    'bg-nexus-info',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'display': ['Orbitron', 'sans-serif'],
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      colors: {
        'nexus-primary': '#22D3EE',
        'nexus-secondary': '#0EA5E9',
        'nexus-accent': '#06B6D4',
        'nexus-dark': '#0A0E1A',
        'nexus-surface': '#111827',
        'nexus-surface-2': '#1A2235',
        'nexus-border': '#1F2937',
        'nexus-light': '#F9FAFB',
        'nexus-muted': '#6B7280',
        'nexus-success': '#10B981',
        'nexus-danger': '#EF4444',
        'nexus-warning': '#F59E0B',
        'nexus-info': '#3B82F6',
      },
      backgroundImage: {
        'nexus-gradient': 'linear-gradient(135deg, #22D3EE 0%, #0EA5E9 50%, #06B6D4 100%)',
        'nexus-gradient-dark': 'linear-gradient(180deg, #0A0E1A 0%, #1A2235 100%)',
      },
      borderRadius: {
        'xl2': '1rem',
      },
      boxShadow: {
        'nexus-glow': '0 0 20px rgba(34, 211, 238, 0.4)',
        'nexus-glow-lg': '0 0 40px rgba(34, 211, 238, 0.7)',
        'nexus-card': '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(34, 211, 238, 0.4)' },
          '100%': { boxShadow: '0 0 25px rgba(34, 211, 238, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
