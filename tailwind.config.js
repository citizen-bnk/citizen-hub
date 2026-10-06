import animate from "tailwindcss-animate";

// The Hub wears the Internet Banking theme: deep indigo surfaces, a violet to magenta to coral brand gradient,
// gold focus, Space Grotesk headings and Inter body text. Colours come from CSS variables in src/index.css, which has
// a dark theme (the default) and a light one, exactly like Internet Banking.
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ['"Space Grotesk"', "Inter", "sans-serif"],
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 4px)", sm: "calc(var(--radius) - 8px)" },
      colors: {
        // Indigo-tinted neutrals: the pages' own gray classes (and their dark: variants) land on the banking palette.
        gray: {
          50: "#f6f3ff", 100: "#ece6fb", 200: "#ddd5f5", 300: "#b3abd6", 400: "#948bbd",
          500: "#7a71a3", 600: "#5d5388", 700: "#453b6e", 800: "#2a2058", 900: "#171036", 950: "#0f0a2a",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))", dark: "#5237d9", light: "#8b7aff" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        success: "#3ee08f",
        warning: "#ffb547",
        error: "#ff6b7a",
        gold: "#ffb547",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: { "accordion-down": "accordion-down 0.2s ease-out", "accordion-up": "accordion-up 0.2s ease-out" },
    },
  },
  plugins: [animate],
};
