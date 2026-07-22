/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f8f7', 100: '#dfecea', 200: '#bfd9d5', 300: '#98c0bb',
          400: '#6ea59e', 500: '#568f88', 600: '#449087', 700: '#397a73',
          800: '#32635e', 900: '#2c534f',
        },
        teal: {
          50: '#f3f8f7', 100: '#dfecea', 200: '#bfd9d5', 300: '#98c0bb',
          400: '#6ea59e', 500: '#568f88', 600: '#449087', 700: '#397a73',
          800: '#32635e', 900: '#2c534f', 950: '#172f2c',
        },
      }
    },
  },
  plugins: [],
}
