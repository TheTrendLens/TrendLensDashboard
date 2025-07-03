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
          // '50': '#f1f7fd',
          // '100': '#e0edf9',
          '100': '#c8e0f5',
          '200': '#a3cded',
          '300': '#77b1e3',
          '400': '#5695db',
          '500': '#427bce',
          '600': '#3867bd',
          '700': '#33559a',
          '800': '#2e497a',
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
