const colors = require('tailwindcss/colors');

module.exports = {
  important: true,
  purge: {
      enabled: true,
      content: [
          './apps/ui/**/*.{html,ts}',
          './libs/**/*.{html,ts}',
      ],
      safelist: [
        'bg-red-700',
        'bg-blue-300',
        'text-white'
      ]
  },
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    colors: {
      background: '#212121',
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.slate,
      blue: colors.blue,
      red: colors.red
    }
  },
  variants: {
      extend: {},
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}