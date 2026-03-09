
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        green: {
          bright: '#63D44A',
          medium: '#3BC25B',
        },
        teal: {
          DEFAULT: '#1FAF8E',
          deep: '#0E8F79',
        },
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '15%': { transform: 'scale(1.12)', opacity: '0.85' },
          '30%': { transform: 'scale(1)', opacity: '1' },
          '45%': { transform: 'scale(1.08)', opacity: '0.9' },
          '60%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        heartbeat: 'heartbeat 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
