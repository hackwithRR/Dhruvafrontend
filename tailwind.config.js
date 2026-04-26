/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Path to all your components
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  // 2. Enable class-based dark mode
  darkMode: 'class',

  theme: {
    extend: {
      // 3. Custom Animations
      animation: {
        blob: "blob 7s infinite",
        scan: "scan 3s linear infinite",
        shine: "shine 3s ease-in-out infinite",
        'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
        'star-movement-top': 'star-movement-top linear infinite alternate',
      },
      // 4. Custom Keyframes
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        scan: { "0%": { top: "-10%" }, "100%": { top: "110%" } },
        shine: { "0%": { left: "-100%" }, "100%": { left: "200%" } },
        'star-movement-bottom': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(-100%, 0%)', opacity: '0' },
        },
        'star-movement-top': {
          '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
          '100%': { transform: 'translate(100%, 0%)', opacity: '0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px var(--tw-shadow-color)' },
          '50%': { boxShadow: '0 0 25px var(--tw-shadow-color)' }
        },
        'glow-red': {
          '0%, 100%': { boxShadow: '0 0 10px #ef4444aa' },
          '50%': { boxShadow: '0 0 30px #ef4444ff' }
        }
      },
      animation: {
        blob: "blob 7s infinite",
        scan: "scan 3s linear infinite",
        shine: "shine 3s ease-in-out infinite",
        'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
        'star-movement-top': 'star-movement-top linear infinite alternate',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'glow-red': 'glow-red 1.5s ease-in-out infinite'
      }
    },
  },

  // 5. Critical Safelist (Forces Tailwind to keep these colors)
  safelist: [
    { 
      pattern: /(bg|text|border|from|to)-(indigo|rose|cyan|amber|slate|emerald)-(400|500|600|700|800|900|950)/ 
    },
    { 
      pattern: /bg-opacity-(10|20|30|40|50)/ 
    },
    // Light theme borders for input visibility
    'border-slate-(200|300|400)',
    'dark\\:border-(white|slate)-(10|20|30)',
    'focus\\:border-slate-(300|400)',
    'dark\\:focus\\:border-(white|slate)-(20|30)',
    // Specific theme hex backgrounds used in your Chat.js logic
    'bg-[#050505]', 
    'bg-[#f8fafc]', 
    'bg-[#1a0f12]', 
    'bg-[#0a0a0f]'
  ],

  plugins: [],
};
