// Theme - light/dark with green for positive, red for negative metrics
export interface ThemeConfig {
  name: string;
  bg: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  glow: string;
  chartLine: string;
  chartBar: string;
  chartArea: string;
  chartText: string;
  chartGrid: string;
  success: string;
  warning: string;
  info: string;
  shadow: string;
}

export const themes: Record<string, ThemeConfig> = {
  dark: {
    name: "Dark",
    bg: "#000000",
    foreground: "#f5f5f5",
    card: "#1a1a1a",
    cardForeground: "#f5f5f5",
    popover: "#1a1a1a",
    popoverForeground: "#f5f5f5",
    primary: "#0000bb",
    primaryForeground: "#ffffff",
    secondary: "#2b2b2b",
    secondaryForeground: "#f5f5f5",
    muted: "#2b2b2b",
    mutedForeground: "#737373",
    accent: "#3b82f6",
    accentForeground: "#ffffff",
    destructive: "#FF6B56",
    destructiveForeground: "#000000",
    border: "#404040",
    input: "#525252",
    ring: "#0000bb",
    glow: "rgba(0, 0, 187, 0.3)",
    chartLine: "#3b82f6",
    chartBar: "#398282",
    chartArea: "rgba(59, 130, 246, 0.2)",
    chartText: "rgba(245, 245, 245, 0.5)",
    chartGrid: "rgba(255, 255, 255, 0.06)",
    success: "#10b981",
    warning: "#f59e0b",
    info: "#3b82f6",
    shadow: "0 2px 6px -2px rgba(0,0,0,.75)",
  },
  light: {
    name: "Light",
    bg: "#f5f5f5",
    foreground: "#000000",
    card: "#ffffff",
    cardForeground: "#000000",
    popover: "#f5f5f5",
    popoverForeground: "#000000",
    primary: "#0000bb",
    primaryForeground: "#ffffff",
    secondary: "#ededed",
    secondaryForeground: "#000000",
    muted: "#f5f5f5",
    mutedForeground: "#737373",
    accent: "#2563eb",
    accentForeground: "#ffffff",
    destructive: "#FF6B56",
    destructiveForeground: "#000000",
    border: "#e5e5e5",
    input: "#d4d4d4",
    ring: "#0000bb",
    glow: "rgba(0, 0, 187, 0.2)",
    chartLine: "#398282",
    chartBar: "#398282",
    chartArea: "rgba(57, 130, 130, 0.15)",
    chartText: "rgba(0, 0, 0, 0.6)",
    chartGrid: "rgba(0, 0, 0, 0.06)",
    success: "#059669",
    warning: "#d97706",
    info: "#2563eb",
    shadow: "0 2px 6px -2px rgba(0,0,0,.15)",
  },
};
