/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-cream': '#F8F6F0',
        'brand-dark-teal': '#2C3E50',
        'brand-warm-beige': '#E8DCC6',
        'brand-soft-gray': '#95A5A6',
        'brand-muted-teal': '#34495E',
        'brand-text-dark': '#2C3E50',
        'brand-text-light': '#FFFFFF',
        'brand-light-beige': '#F5F1E8',
        'brand-darker-teal': '#1A252F',
        'brand-text-muted': '#7F8C8D',
        'brand-text-primary': '#2C3E50',
        'brand-text-primary-dark': '#FFFFFF'
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};