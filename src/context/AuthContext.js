/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        blob: "blob 7s infinite",
        scan: "scan 3s linear infinite",
        shine: "shine 3s ease-in-out infinite",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        scan: { "0%": { top: "-10%" }, "100%": { top: "110%" } },
        shine: { "0%": { left: "-100%" }, "100%": { left: "200%" } }
      },
    },
  },
  // This tells Tailwind to NEVER delete these color classes
  safelist: [
    { pattern: /(bg|text|border|from|to)-(indigo|rose|cyan|amber|slate|emerald)-(400|500|600|700|800|900|950)/ },
    { pattern: /bg-opacity-(10|20|30|40|50)/ },
  ],
  plugins: [],
};
