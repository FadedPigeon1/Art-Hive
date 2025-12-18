/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#1DA1F2",
          dark: "#1A8CD8",
        },
        secondary: {
          light: "#8B5CF6",
          dark: "#7C3AED",
        },
        background: {
          light: "#FFFFFF",
          dark: "#000000",
        },
        surface: {
          light: "#F7F9F9",
          dark: "#16181C",
        },
        border: {
          light: "#EFF3F4",
          dark: "#2F3336",
        },
        text: {
          primary: {
            light: "#0F1419",
            dark: "#E7E9EA",
          },
          secondary: {
            light: "#536471",
            dark: "#71767B",
          },
        },
      },
    },
  },
  plugins: [],
};
