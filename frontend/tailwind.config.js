/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: { primary: "#4F46E5", ink: "#0F1117", surface: "#F8FAFC", surfaceDark: "#171A23" },
      borderRadius: { md2: "8px", lg2: "12px", xl2: "16px" },
      fontFamily: {
        sans: ["Inter", "'Hind Siliguri'", "'Noto Sans Bengali'", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
