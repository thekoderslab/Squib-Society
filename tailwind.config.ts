import type { Config } from "tailwindcss";

/**
 * Design tokens live here and in globals.css (as CSS variables).
 * Everything the brief calls a "named token" is reachable from Tailwind:
 *   bg-cream  bg-surface  text-ink  bg-squib  bg-squib-deep  text-flare
 *   bg-locked  border-hairline
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F4EFE6",
        surface: "#FBF8F2",
        ink: "#262019",
        squib: {
          DEFAULT: "#56B947",
          deep: "#3E8F33",
          // derived tints, kept in-family so the page never picks up a second hue
          soft: "#E8F4E5",
          wash: "#F1F8EF",
        },
        flare: "#D8362B",
        locked: "#D8CFC0",
        hairline: "#E7E0D3",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        squib: "20px",
        card: "24px",
        vault: "28px",
      },
      boxShadow: {
        // single subtle bottom shadow — molded vinyl, not neumorphism
        card: "0 12px 24px -16px rgba(38, 32, 25, 0.30)",
        lift: "0 22px 44px -22px rgba(38, 32, 25, 0.40)",
        press: "0 4px 10px -6px rgba(38, 32, 25, 0.35)",
        green: "0 12px 26px -14px rgba(62, 143, 51, 0.65)",
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      keyframes: {
        shiver: {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "20%": { transform: "translateX(-1.5px) rotate(-2.5deg)" },
          "45%": { transform: "translateX(1.5px) rotate(2.5deg)" },
          "70%": { transform: "translateX(-1px) rotate(-1.5deg)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        flicker: {
          "0%, 100%": { transform: "scale(1) rotate(-1deg)", opacity: "1" },
          "50%": { transform: "scale(1.08) rotate(2deg)", opacity: "0.92" },
        },
        blink: {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "96%": { transform: "scaleY(0.1)" },
        },
        pop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        shiver: "shiver 420ms ease-in-out",
        bob: "bob 5s ease-in-out infinite",
        flicker: "flicker 1.6s ease-in-out infinite",
        blink: "blink 6s ease-in-out infinite",
        pop: "pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
