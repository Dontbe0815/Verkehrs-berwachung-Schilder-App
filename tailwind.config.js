/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: { boxShadow: { soft: "0 14px 50px rgba(0,0,0,.35)" } } },
  plugins: []
};
