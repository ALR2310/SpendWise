/** @type {import('tailwindcss').Config} */
export default {
  content: ["./www/**/*.{html,js,hbs}"],
  safelist: [{ pattern: /alert|btn|flex|justify/ },],
  theme: { extend: {} },
  plugins: [require('daisyui')],
  daisyui: { themes: ["light", "dark",] }
}

