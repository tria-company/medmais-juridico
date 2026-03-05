/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#C41E3A',
          600: '#A8192F',
          700: '#8B1323',
          800: '#6F0F1C',
          900: '#520B14',
        },
        accent: {
          DEFAULT: '#D4532B',
          light: '#E8734F',
          dark: '#B8431F',
        }
      }
    },
  },
  plugins: [],
}
