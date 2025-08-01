/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        twitter: {
          50: '#e8f5fd',
          100: '#d0ecfa',
          200: '#a1d9f5',
          300: '#72c5ef',
          400: '#43b2ea',
          500: '#1da1f2',
          600: '#0d8bd9',
          700: '#0a6ba8',
          800: '#075477',
          900: '#043d55',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      maxWidth: {
        'tweet': '600px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}