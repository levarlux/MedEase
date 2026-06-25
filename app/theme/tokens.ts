/**
 * Design tokens as a plain object — for places Tailwind can't reach:
 * SVG strokes, react-native-svg rings, inline styles, etc.
 *
 * Mirrors tailwind.config.ts. Keep the two in sync.
 */
export const colors = {
  background: "#f8f9fa",
  surface: "#f8f9fa",
  surfaceDim: "#d9dadb",
  surfaceBright: "#f8f9fa",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f3f4f5",
  surfaceContainer: "#edeeef",
  surfaceContainerHigh: "#e7e8e9",
  surfaceContainerHighest: "#e1e3e4",
  surfaceVariant: "#e1e3e4",
  inverseSurface: "#2e3132",
  inverseOnSurface: "#f0f1f2",

  onBackground: "#191c1d",
  onSurface: "#191c1d",
  onSurfaceVariant: "#3f4946",
  outline: "#6f7976",
  outlineVariant: "#bec9c5",

  primary: "#146a5c",
  onPrimary: "#ffffff",
  primaryContainer: "#86d2c1",
  onPrimaryContainer: "#005c4f",
  primaryFixed: "#a4f1df",
  primaryFixedDim: "#89d5c4",

  secondary: "#33628b",
  onSecondary: "#ffffff",
  secondaryContainer: "#a4d0ff",
  onSecondaryContainer: "#295982",

  tertiary: "#685f25",
  onTertiary: "#ffffff",
  tertiaryContainer: "#d2c580",
  onTertiaryContainer: "#5a5118",
  tertiaryFixed: "#f1e39c",

  error: "#ba1a1a",
  onError: "#ffffff",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
} as const;

/** Resolves an Accent tier → its main + container hex colors (for SVG/icon use). */
export const accentColors = {
  primary: { main: colors.primary, container: colors.primaryContainer, onContainer: colors.onPrimaryContainer },
  secondary: { main: colors.secondary, container: colors.secondaryContainer, onContainer: colors.onSecondaryContainer },
  tertiary: { main: colors.tertiary, container: colors.tertiaryContainer, onContainer: colors.onTertiaryContainer },
  error: { main: colors.error, container: colors.errorContainer, onContainer: colors.onErrorContainer },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  marginMobile: 20,
} as const;

export const radius = {
  card: 24,
  cardLarge: 32,
  input: 12,
  pill: 9999,
} as const;

export const shadow = {
  clinical: "0px 10px 30px rgba(0,0,0,0.04)",
  navPill: "0px 8px 24px rgba(0,0,0,0.18)",
} as const;

export type Accent = keyof typeof accentColors;
