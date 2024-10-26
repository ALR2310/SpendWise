/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./www/**/*.{html,js}",
  ],
  safelist: [
    { pattern: /alert|btn|flex|justify/, },
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
}

