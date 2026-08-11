import type { Config } from "tailwindcss";

/**
 * BRUTALIST VINTAGE
 *
 * Aged paper stock, hard black rules, flat blocks of colour, offset shadows
 * with no blur. Nothing is round, nothing is soft, nothing glows.
 *
 * Token names are unchanged from the previous system on purpose — the whole
 * restyle lands through this file rather than through hundreds of class edits.
 *   cream    → the page, aged newsprint
 *   surface  → card stock, one shade lighter
 *   hairline → now solid ink, because every rule is a printed line
 *   flare    → oxide red, the second ink in the press
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#E9E1CF",
        surface: "#F6F1E3",
        ink: "#17150F",
        squib: {
          DEFAULT: "#56B947",
          deep: "#2E7226",
          soft: "#CFE4C6",
          wash: "#DDEBD4",
        },
        flare: "#C1402E",
        locked: "#D6CBB0",
        hairline: "#17150F",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      /**
       * Everything is square. The named radii stay so existing markup keeps
       * compiling; they simply resolve to nothing now.
       */
      borderRadius: {
        squib: "0px",
        card: "0px",
        vault: "0px",
      },
      /**
       * Hard offset shadows — a printed drop shadow, not a light source.
       * Zero blur is the whole point; the moment it blurs it stops being
       * brutalist and starts being a soft UI card again.
       */
      boxShadow: {
        card: "3px 3px 0 0 #17150F",
        lift: "6px 6px 0 0 #17150F",
        press: "1px 1px 0 0 #17150F",
        green: "4px 4px 0 0 #2E7226",
        flare: "4px 4px 0 0 #C1402E",
      },
      letterSpacing: {
        tightest: "-0.03em",
        stamp: "0.22em",
      },
      keyframes: {
        shiver: {
          "0%, 100%": { transform: "translate(0,0)" },
          "25%": { transform: "translate(-1.5px,1px)" },
          "50%": { transform: "translate(1.5px,-1px)" },
          "75%": { transform: "translate(-1px,-1px)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        flicker: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.08)", opacity: "0.92" },
        },
        pop: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        shiver: "shiver 320ms steps(3, end)",
        bob: "bob 5s ease-in-out infinite",
        flicker: "flicker 1.6s steps(2, end) infinite",
        pop: "pop 120ms steps(3, end)",
      },
    },
  },
  plugins: [],
};

export default config;
