/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Urbanist', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff5f2',
          100: '#ffe8e0',
          200: '#ffd8d8',
          300: '#fca5a5',
          400: '#f87171',
          500: '#B22E04',
          600: '#9A2703',
          700: '#7E1E00',
          800: '#6F0F1C',
          900: '#520B14',
        },
        accent: {
          DEFAULT: '#B22E04',
          light: '#C32F00',
          dark: '#7E1E00',
        },
        // General colors from Figma
        fig: {
          red: '#FF0000',
          yellow: '#FFCC00',
          blue: '#0022FF',
          green: '#149403',
          gray: '#5B5B5B',
          black: '#151515',
        },
      },
    },
  },
  plugins: [],
}
