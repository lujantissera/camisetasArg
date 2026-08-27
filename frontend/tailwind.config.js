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
        // Paleta "estadio de noche" — base oscura premium para navbar/hero/footer.
        pitch: {
          950: '#050b14',
          900: '#0a1526',
          800: '#0f2038',
          700: '#16304f',
        },
        grass: {
          DEFAULT: '#1fa34f',
          d: '#157a3a',
        },
      },
      backgroundImage: {
        'stadium-lights': 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(246,180,14,0.18), transparent 60%), radial-gradient(ellipse 80% 60% at 90% 10%, rgba(116,172,223,0.15), transparent 55%)',
        'pitch-lines': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.05' stroke-width='1'%3E%3Ccircle cx='60' cy='60' r='30'/%3E%3Cpath d='M0 60H120M60 0V120'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
