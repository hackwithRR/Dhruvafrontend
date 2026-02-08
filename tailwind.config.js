/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'blob': "blob 10s infinite",
        'scan': "scan 8s linear infinite",
        'shine': "shine 3s ease-in-out infinite",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(50px, -70px) scale(1.2)" },
          "66%": { transform: "translate(-30px, 30px) scale(0.8)" },
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
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // THIS IS THE KEY: allows html.classList.add('dark') to work
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        blob: "blob 7s infinite",
        scan: "scan 3s linear infinite",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        scan: { "0%": { top: "-10%" }, "100%": { top: "110%" } },
      },
    },
  },
  plugins: [],
};
