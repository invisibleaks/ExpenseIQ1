/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enables dark mode via <div class="dark">
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1C1C1E',    // Charcoal
          dark: '#0E0E10',       // Deep background (dark mode)
          gold: '#E5C07B',       // Elegant Gold
          soft: '#D97706',       // Warm Amber hover
          ivory: '#F4F4F6',      // Light background (light mode)
          text: '#1A1A1A',       // Text for light mode
          'text-dark': '#F5F5F5' // Text for dark mode
        }
      }
    }
  },
  plugins: [],
};

