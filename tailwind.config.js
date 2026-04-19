/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './admin.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        flan: {
          caramel: 'rgb(228,140,60)',
          mold:    '#c97a28',
          dark:    '#4a2c1a',
          syrup:   '#2b180d',
          custard: '#f9e8c0',
          cream:   '#fdf5e4',
          oat:     '#f3e8d2',
          stone:   '#ede3ce',
        }
      },
      fontFamily: {
        fredoka: ['Fredoka', 'sans-serif'],
        inter:   ['Inter', 'sans-serif'],
        serif:   ['Playfair Display', 'serif'],
      }
    }
  },
  plugins: [],
};
