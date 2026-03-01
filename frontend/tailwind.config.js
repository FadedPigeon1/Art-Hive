/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#8B5CF6", // Purple/Violet
          dark: "#A855F7",
        },
        secondary: {
          light: "#F43F5E", // Red/Rose
          dark: "#FB7185",
        },
        accent: {
          light: "#3B82F6", // Blue
          dark: "#60A5FA",
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
