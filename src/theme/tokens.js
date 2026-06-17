/* ---------------- design tokens ----------------
   Single source of truth for color + type.
   `applyTheme` mirrors the color tokens into CSS custom
   properties so styles/index.css can consume them. */
export const T = {
  bg: "#F7F7F4",
  surface: "#FFFFFF",
  canvas: "#FCFCFA",
  border: "#E5E5DF",
  ink: "#15171C",
  muted: "#6B7080",
  accent: "#2742EC",      // cobalt — the one brand color
  accentSoft: "#EDF0FE",
  signal: "#E8590C",      // orange — reserved for path tracing only
  rampLo: [200, 205, 222],
  rampHi: [39, 66, 236],
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

/* CSS custom properties consumed by styles/index.css */
const CSS_VARS = {
  "--bg": T.bg,
  "--surface": T.surface,
  "--border": T.border,
  "--ink": T.ink,
  "--muted": T.muted,
  "--accent": T.accent,
  "--accent-soft": T.accentSoft,
};

export function applyTheme(root = document.documentElement) {
  for (const [k, v] of Object.entries(CSS_VARS)) root.style.setProperty(k, v);
}
