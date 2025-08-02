/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Exact colors from the palette specification
        'charcoal-navy': '#1E2B32',
        'deep-blue-gray': '#27343B',
        'ivory': '#F0EDE5',
        'warm-gray': '#C5C3BE',
        'slate-graphite': '#3E4A51',
        // Additional supporting colors
        'gold': '#FFD700',
        'white': '#FFFFFF',
        'black': '#000000'
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};