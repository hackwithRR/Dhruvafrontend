/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
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
  safelist: [
    'bg-[#050505]', 'bg-[#1a0f12]', 'bg-[#0a0a0f]', 'bg-[#f8fafc]',
    { pattern: /(bg|text|border)-(indigo|rose|cyan|emerald)-(400|500|600)/ }
  ],
  plugins: [],
};
