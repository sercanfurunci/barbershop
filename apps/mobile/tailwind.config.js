/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#F5F1EB",
        foreground: "#111111",
        card: "#FFFFFF",
        "card-foreground": "#111111",
        primary: "#111111",
        "primary-foreground": "#FFFFFF",
        secondary: "#EFEAE2",
        "secondary-foreground": "#44403C",
        muted: "#EFEAE2",
        "muted-foreground": "#6B6B6B",
        accent: "#111111",
        "accent-foreground": "#FFFFFF",
        destructive: "#B91C1C",
        border: "#E7E0D7",
        input: "#FFFFFF",
        // Dark mode tokens
        dark: {
          background: "#111111",
          foreground: "#F5F1EB",
          card: "#1a1a1a",
          "card-foreground": "#F5F1EB",
          border: "#2a2a2a",
          muted: "#1e1e1e",
          "muted-foreground": "#A0A0A0",
          input: "#1e1e1e",
        },
      },
      fontFamily: {
        sans: ["Outfit_400Regular", "system-ui"],
        medium: ["Outfit_500Medium", "system-ui"],
        semibold: ["Outfit_600SemiBold", "system-ui"],
        bold: ["Outfit_700Bold", "system-ui"],
      },
    },
  },
  plugins: [],
};
