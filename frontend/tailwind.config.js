/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // optional but good for future
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0a0a0a',   // Define exactly what you want
          900: '#111111',
          800: '#1e293b',
          // Add more if you use them: 700, 600 etc.
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
        },
      },
    },
  },
  plugins: [],
}