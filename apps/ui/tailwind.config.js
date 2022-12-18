const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  important: true,
  content: {
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
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}