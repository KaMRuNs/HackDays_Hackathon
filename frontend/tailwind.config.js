/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#5B2C91", dark: "#43206B", light: "#7B4DB5" },
        accent: { DEFAULT: "#FF6B4A", light: "#FFE3DC" },
        lavender: "#F3EEFB",
        ink: "#1F1535",
      },
      fontFamily: { sans: ["Poppins", "system-ui", "sans-serif"] },
      boxShadow: { soft: "0 8px 30px rgba(91, 44, 145, 0.10)" },
    },
  },
  plugins: [],
};
