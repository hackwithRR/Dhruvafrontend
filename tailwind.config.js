/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Enable Dark Mode
  darkMode: 'class', 

  // 2. Track all your files
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      // 3. Merged Animations
      animation: {
        blob: "blob 7s infinite",
        scan: "scan 3s linear infinite",
        shine: "shine 3s ease-in-out infinite",
      },
      // 4. Merged Keyframes
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        scan: { 
          "0%": { top: "-10%" }, 
          "100%": { top: "110%" } 
        },
        shine: { 
          "0%": { left: "-100%" }, 
          "100%": { left: "200%" } 
        }
      },
    },
  },

  // 5. Critical Safelist (Prevents colors from disappearing)
  safelist: [
    { pattern: /(bg|text|border|from|to)-(indigo|rose|cyan|amber|slate|emerald)-(400|500|600|700|800|900|950)/ },
    { pattern: /bg-opacity-(10|20|30|40|50)/ },
    'bg-[#050505]', 
    'bg-[#f8fafc]', 
    'bg-[#1a0f12]', 
    'bg-[#0a0a0f]'
  ],

  plugins: [],
};
