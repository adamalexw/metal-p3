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
      extend: {},
  },
  variants: {
      extend: {},
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}