
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
    },
  },
  plugins: [],
}
