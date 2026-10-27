import { createContext } from "react";

export type Theme = "light" | "dark" | "system";
export type Contrast = "standard" | "medium" | "high";

export type ThemeProviderState = {
  theme: Theme;
  contrast: Contrast;
  setTheme: (theme: Theme) => void;
  setContrast: (contrast: Contrast) => void;
};

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);
