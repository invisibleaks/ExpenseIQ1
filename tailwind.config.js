/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-dark-teal': '#2C3E50',
        'brand-darker-teal': '#1A252F',
        'brand-muted-teal': '#34495E',
        'brand-warm-beige': '#E8DCC6',
        'brand-light-beige': '#F5F1E8',
        'brand-cream': '#F8F6F0',
        'brand-soft-gray': '#95A5A6',
        'brand-text-light': '#FFFFFF',
        'brand-text-dark': '#2C3E50',
        'brand-text-muted': '#7F8C8D',
      }
    },
  },
  plugins: [],
}