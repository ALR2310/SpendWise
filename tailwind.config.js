/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./www/**/*.{html,js,hbs}",
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
  daisyui: {
    themes: ["light", "dark",]
  }
}

