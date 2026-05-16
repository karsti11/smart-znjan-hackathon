import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "system-ui",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "sans-serif",
        ],
      },
      colors: {
        // Smart Žnjan palette — noćni Split: tamno more + teal odsjaj
        ink: {
          50:  "#e6edf7",
          100: "#c5d3e8",
          200: "#9ab1d4",
          300: "#6c8cbb",
          400: "#3f6ba5",
          500: "#1f4d8a",
          600: "#143a6e",
          700: "#0d2a55",
          800: "#081d3d",
          900: "#04122a",
          950: "#020a1a",
        },
        teal: {
          300: "#7ce2d7",
          400: "#3fd5c6",
          500: "#1fbfae",
          600: "#0ea592",
          700: "#0b7e72",
        },
        coral: {
          400: "#ff8a5b",
          500: "#ff6b3d",
        },
        sand: {
          200: "#f3e7c8",
          300: "#e6d39c",
        },
      },
      boxShadow: {
        glow: "0 0 24px rgba(63, 213, 198, 0.25)",
        "glow-lg": "0 0 60px rgba(63, 213, 198, 0.18)",
        card: "0 6px 28px -10px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(126, 226, 215, 0.08)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(63, 213, 198, 0.0)" },
          "50%": { boxShadow: "0 0 24px 4px rgba(63, 213, 198, 0.35)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "wave-slow": {
          "0%": { transform: "translateX(0) translateY(0)" },
          "50%": { transform: "translateX(-20px) translateY(-6px)" },
          "100%": { transform: "translateX(0) translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 260ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "slide-up": "slide-up 320ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        shimmer: "shimmer 2.6s linear infinite",
        "wave-slow": "wave-slow 16s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-night":
          "radial-gradient(at 18% 4%, rgba(63, 213, 198, 0.14) 0px, transparent 45%), radial-gradient(at 85% 0%, rgba(31, 77, 138, 0.45) 0px, transparent 55%), radial-gradient(at 92% 92%, rgba(255, 138, 91, 0.10) 0px, transparent 55%), linear-gradient(180deg, #04122a 0%, #02091a 100%)",
        shimmer:
          "linear-gradient(110deg, rgba(126,226,215,0) 0%, rgba(126,226,215,0.18) 45%, rgba(126,226,215,0) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
