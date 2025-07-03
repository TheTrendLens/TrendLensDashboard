/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    extend: {
      screens: {
        '3xl': '120rem',
      },
      colors: {
        'brand': {
          '50': '#f1f7fd',
          '100': '#e0edf9',
          '200': '#c8e0f5',
          '300': '#a3cded',
          '400': '#77b1e3',
          '500': '#5695db',
          '600': '#427bce',
          '700': '#3867bd',
          '800': '#33559a',
          '900': '#2e497a',
          '950': '#172136',
        },
        'custom-red': '#FF5A5A',
        'custom-green': '#4CAF50',
        'custom-purple': '#9C27B0',
      },
    },
  },
  plugins: [],
}
