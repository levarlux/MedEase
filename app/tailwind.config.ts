import { type Config } from "tailwindcss";

/**
 * NativeWind v4 / Tailwind config.
 *
 * The theme extension below ports the "Serene Health" design system
 * (app_design/stitch_adaptive_medication_tracker/serene_health/DESIGN.md)
 * so the Tailwind classes from the source HTML prototypes map almost 1:1.
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ---- Surfaces ----
        background: "#f8f9fa",
        surface: "#f8f9fa",
        "surface-dim": "#d9dadb",
        "surface-bright": "#f8f9fa",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",
        "surface-variant": "#e1e3e4",
        "inverse-surface": "#2e3132",
        "inverse-on-surface": "#f0f1f2",

        // ---- Text / outlines ----
        "on-background": "#191c1d",
        "on-surface": "#191c1d",
        "on-surface-variant": "#3f4946",
        outline: "#6f7976",
        "outline-variant": "#bec9c5",

        // ---- Primary (Mint Green) ----
        primary: "#146a5c",
        "on-primary": "#ffffff",
        "primary-container": "#86d2c1",
        "on-primary-container": "#005c4f",
        "primary-fixed": "#a4f1df",
        "primary-fixed-dim": "#89d5c4",
        "on-primary-fixed": "#00201b",
        "on-primary-fixed-variant": "#005045",
        "surface-tint": "#146a5c",
        "inverse-primary": "#89d5c4",

        // ---- Secondary (Soft Blue) ----
        secondary: "#33628b",
        "on-secondary": "#ffffff",
        "secondary-container": "#a4d0ff",
        "on-secondary-container": "#295982",
        "secondary-fixed": "#cfe5ff",
        "secondary-fixed-dim": "#9ecbf9",
        "on-secondary-fixed": "#001d33",
        "on-secondary-fixed-variant": "#154a72",

        // ---- Tertiary (Warm Yellow / Olive) ----
        tertiary: "#685f25",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#d2c580",
        "on-tertiary-container": "#5a5118",
        "tertiary-fixed": "#f1e39c",
        "tertiary-fixed-dim": "#d4c782",
        "on-tertiary-fixed": "#201c00",
        "on-tertiary-fixed-variant": "#50470f",

        // ---- Error (muted coral) ----
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      fontFamily: {
        manrope: ["Manrope", "System"],
      },
      fontSize: {
        // Type scale from DESIGN.md (Manrope)
        "display-lg": ["34px", { lineHeight: "44px", fontWeight: "700", letterSpacing: "-0.02em" }],
        "headline-lg": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "headline-lg-mobile": ["22px", { lineHeight: "28px", fontWeight: "700" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "26px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "20px", fontWeight: "600", letterSpacing: "0.01em" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      spacing: {
        // 4px base unit
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        gutter: "16px",
        "margin-mobile": "20px",
        "margin-desktop": "64px",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      boxShadow: {
        clinical: "0px 10px 30px rgba(0,0,0,0.04)",
        "clinical-glow": "0px 10px 30px rgba(20,106,92,0.04)",
        "nav-pill": "0px 8px 24px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;
