/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        arg: {
          blue:      '#74ACDF',
          'blue-d':  '#2d6aa0',
          'blue-dk': '#1a3c5e',
          gold:      '#F6B40E',
          'gold-d':  '#c4920c',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
