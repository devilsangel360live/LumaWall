/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Earthy Tones palette
        earthy: {
          rose: '#EDAFB8',
          peach: '#F7E1D7',
          cream: '#F4F1DE',
          sage: '#B0C4B1',
          slate: '#4A5759',
          // Lighter variations for backgrounds
          roseLight: '#F5D7DD',
          peachLight: '#FBF0E9',
          creamLight: '#F0EDE8',
          sageLight: '#D8E3D9',
          slateLight: '#6B7578'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Nunito Sans', 'system-ui', 'sans-serif']
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
