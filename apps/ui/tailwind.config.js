module.exports = {
  purge: {
      enabled: true,
      content: [
          './apps/ui/**/*.{html,ts}',
          './libs/**/*.{html,ts}',
      ],
  },
  darkMode: 'media', // or 'media' or 'class'
  theme: {
      extend: {},
  },
  variants: {
      extend: {},
  },
  plugins: [],
}