module.exports = {
  purge: {
      enabled: true,
      content: [
          './apps/ui/**/*.{html,ts}',
          './libs/**/*.{html,ts}',
      ],
      safelist: [
        'bg-red-700',
        'bg-blue-400',
        'text-white'
      ]
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