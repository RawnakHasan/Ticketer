import {
  ThemeProviderContext,
  type Contrast,
  type Theme,
  type ThemeProviderState,
} from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultContrast?: Contrast;
  storageKey?: string;
};

const THEMES: readonly Theme[] = ["light", "dark", "system"];
const CONTRASTS: readonly Contrast[] = ["standard", "medium", "high"];
const ALL_CLASSES = [
  "light",
  "light-medium-contrast",
  "light-high-contrast",
  "dark",
  "dark-medium-contrast",
  "dark-high-contrast",
];

function readStorage<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value as T) ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable, ignore */
  }
}

function applyTheme(theme: Theme, contrast: Contrast) {
  const mode =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  const className = contrast === "standard" ? mode : `${mode}-${contrast}-contrast`;

  const root = document.documentElement;
  root.classList.remove(...ALL_CLASSES);
  root.classList.add(className);
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultContrast = "standard",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const contrastKey = `${storageKey}-contrast`;

  const [theme, setThemeState] = useState<Theme>(() =>
    readStorage(storageKey, THEMES, defaultTheme),
  );
  const [contrast, setContrastState] = useState<Contrast>(() =>
    readStorage(contrastKey, CONTRASTS, defaultContrast),
  );

  useEffect(() => {
    applyTheme(theme, contrast);

    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(theme, contrast);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, contrast]);

  const value: ThemeProviderState = {
    theme,
    contrast,
    setTheme: (next) => {
      writeStorage(storageKey, next);
      setThemeState(next);
    },
    setContrast: (next) => {
      writeStorage(contrastKey, next);
      setContrastState(next);
    },
  };

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}
