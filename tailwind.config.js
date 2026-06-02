/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Microsoft YaHei', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 24px 80px rgba(190, 121, 147, 0.14)',
        soft: '0 12px 36px rgba(122, 91, 104, 0.10)',
      },
      colors: {
        cream: '#fffaf6',
        blush: '#f6dce6',
        roseglass: '#fff2f6',
        ink: '#302a2f',
        muted: '#81737b',
      },
    },
  },
  plugins: [],
};
