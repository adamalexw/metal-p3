const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  content: ['./apps/ui/**/*.{html,ts}', './libs/**/*.{html,ts}'],
  theme: {
    colors: {
      background: '#212121',
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.slate,
      blue: colors.blue,
      red: colors.red,
    },
  },
};
