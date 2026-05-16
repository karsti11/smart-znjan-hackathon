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
        // Smart Žnjan palette — sunčani Mediteran: bijela, žuta, narančasta
        // Token names `ink`/`teal` kept for class compatibility, hex values are
        // now warm neutrals + bright yellow so we don't have to rename usages.
        ink: {
          50:  "#ffffff",
          100: "#fff8e7",
          200: "#f3e7c8",
          300: "#e6d39c",
          400: "#c9a86a",
          500: "#8a6a3a",
          600: "#5c3f1a",
          700: "#3a2810",
          800: "#1f1408",
          900: "#110a04",
          950: "#050200",
        },
        teal: {
          300: "#ffe066",
          400: "#ffd400",
          500: "#ffb800",
          600: "#e09a00",
          700: "#b87a00",
        },
        coral: {
          400: "#ff8a3d",
          500: "#ff6a1a",
        },
        sand: {
          200: "#fff4d6",
          300: "#ffe9a8",
        },
      },
      boxShadow: {
        glow: "0 0 24px rgba(255, 212, 0, 0.30)",
        "glow-lg": "0 0 60px rgba(255, 184, 0, 0.22)",
        card: "0 6px 28px -10px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 224, 102, 0.10)",
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
          "0%, 100%": { boxShadow: "0 0 14px 1px rgba(255, 212, 0, 0.22)" },
          "50%":      { boxShadow: "0 0 20px 2px rgba(255, 184, 0, 0.36)" },
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
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        shimmer: "shimmer 2.6s linear infinite",
        "wave-slow": "wave-slow 16s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-night":
          "radial-gradient(at 18% 4%, rgba(255, 224, 102, 0.18) 0px, transparent 45%), radial-gradient(at 85% 0%, rgba(255, 138, 61, 0.30) 0px, transparent 55%), radial-gradient(at 92% 92%, rgba(255, 184, 0, 0.18) 0px, transparent 55%), linear-gradient(180deg, #110a04 0%, #050200 100%)",
        shimmer:
          "linear-gradient(110deg, rgba(255,224,102,0) 0%, rgba(255,224,102,0.22) 45%, rgba(255,224,102,0) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
