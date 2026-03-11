/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f7ff',
          100: '#e0efff',
          200: '#b9dbff',
          300: '#7bbeff',
          400: '#369cff',
          500: '#0a7df5',
          600: '#0062d1',
          700: '#004fa8',
          800: '#003d82',
          900: '#00306b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
