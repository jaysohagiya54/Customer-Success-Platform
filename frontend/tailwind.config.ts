import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Legacy brand palette kept for any unreachable references
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          200: "#bcd0fc",
          300: "#94b1fa",
          400: "#6b8df7",
          500: "#4c6ef5",
          600: "#3b5bdb",
          700: "#2f4bc4",
        },
        // Claude-style palette
        claude: {
          cream: "#F9F7F2",
          "cream-dark": "#F0EDE6",
          dark: "#151515",
          surface: "#1E1E1E",
          text: "#1D1D1B",
          "text-soft": "#4A4A48",
          "text-muted": "#7A7A78",
          "text-dark": "#E8E8E8",
          "text-dark-muted": "#A0A09E",
          accent: "#D97757",
          "accent-hover": "#C86644",
          border: "#E5E2DB",
          "border-dark": "#2E2E2E",
          "surface-hover": "#F3F0E9",
          "surface-dark-hover": "#252525",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Charter", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        "claude-sm": "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "claude-md": "0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)",
        "claude-lg": "0 10px 30px 0 rgba(0,0,0,0.10), 0 4px 8px -4px rgba(0,0,0,0.06)",
      },
      transitionProperty: {
        theme: "background-color, border-color, color, fill, stroke",
      },
      transitionDuration: {
        theme: "300ms",
      },
    },
  },
  plugins: [],
};

export default config;
