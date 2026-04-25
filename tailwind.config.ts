import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E0F2F1',
          100: '#B2DFDB',
          200: '#80CBC4',
          300: '#4DB6AC',
          400: '#26A69A',
          500: '#009688',
          600: '#00897B',
          700: '#00796B',
          800: '#00695C',
          900: '#004D40',
        },
        secondary: {
          DEFAULT: '#90A4AE',
          light: '#B0BEC5',
          dark: '#78909C',
        },
        forest: {
          bg: '#E0F2F1',
          stone: '#90A4AE',
          teal: '#26A69A',
          navy: '#1A237E',
          dark: '#0D1117',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: '#334155',
            a: {
              color: '#26A69A',
              '&:hover': {
                color: '#00897B',
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
