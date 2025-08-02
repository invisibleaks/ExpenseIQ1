/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enables dark mode via <div class="dark">
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Primary colors - Dark Teal/Slate
          'dark-teal': '#2C3E50',     // Main dark background
          'darker-teal': '#1A252F',   // Deeper teal for contrast
          
          // Accent colors - Warm Beige/Cream
          'warm-beige': '#E8DCC6',    // Primary accent/CTA color
          'light-beige': '#F5F1E8',   // Lighter beige variant
          'cream': '#F8F6F0',         // Lightest cream
          
          // Secondary colors
          'muted-teal': '#34495E',    // Lighter teal for cards/sections
          'soft-gray': '#95A5A6',     // Muted gray for secondary text
          
          // Text colors
          'text-light': '#FFFFFF',    // White text on dark backgrounds
          'text-dark': '#2C3E50',     // Dark text on light backgrounds
          'text-muted': '#7F8C8D'     // Muted text color
        }
      }
    }
  },
  plugins: [],
};

