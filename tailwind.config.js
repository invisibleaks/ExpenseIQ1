/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enables dark mode via <div class="dark">
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Primary colors
          charcoal: '#1C1C1E',   // Light mode primary
          gold: '#E5C07B',       // Dark mode primary
          
          // Secondary colors
          'secondary-light': '#8E8E93',  // Light mode secondary
          'secondary-dark': '#D1D1D6',   // Dark mode secondary
          
          // Accent/CTA colors
          amber: '#D97706',      // Light mode accent
          'soft-gold': '#FBBF24', // Dark mode accent
          
          // Background colors
          ivory: '#F4F4F6',      // Light mode background
          'dark-bg': '#0E0E10',  // Dark mode background
          
          // Text colors
          'text-primary': '#1A1A1A',    // Light mode text
          'text-primary-dark': '#F5F5F5' // Dark mode text
        }
      }
    }
  },
  plugins: [],
};

