import {
  Hct,
  QuantizerCelebi,
  Score,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  argbFromHex,
  argbFromRgb,
  hexFromArgb,
  type DynamicScheme,
} from "@material/material-color-utilities";

import type { PaletteVariant } from "@/lib/palette/schema";

const SCHEMES: Record<
  PaletteVariant,
  new (source: Hct, isDark: boolean, contrast: number) => DynamicScheme
> = {
  tonalSpot: SchemeTonalSpot,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  neutral: SchemeNeutral,
  monochrome: SchemeMonochrome,
  fidelity: SchemeFidelity,
  content: SchemeContent,
  rainbow: SchemeRainbow,
  fruitSalad: SchemeFruitSalad,
};

// Same roles as your light.css / dark.css
const ROLES = [
  "primary",
  "surfaceTint",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
  "background",
  "onBackground",
  "surface",
  "onSurface",
  "surfaceVariant",
  "onSurfaceVariant",
  "outline",
  "outlineVariant",
  "shadow",
  "scrim",
  "inverseSurface",
  "inverseOnSurface",
  "inversePrimary",
  "primaryFixed",
  "onPrimaryFixed",
  "primaryFixedDim",
  "onPrimaryFixedVariant",
  "secondaryFixed",
  "onSecondaryFixed",
  "secondaryFixedDim",
  "onSecondaryFixedVariant",
  "tertiaryFixed",
  "onTertiaryFixed",
  "tertiaryFixedDim",
  "onTertiaryFixedVariant",
  "surfaceDim",
  "surfaceBright",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
] as const;

const CONTRASTS = [
  ["", 0],
  ["medium", 0.5],
  ["high", 1],
] as const;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

// CSS for all 6 theme classes, e.g. `html.dark-high-contrast, html .dark-high-contrast { ... }`.
// `html .x` has higher specificity than your static `.x`, so this wins whatever the order.
export function buildPaletteCss(seed: string, variant: PaletteVariant): string {
  const source = Hct.fromInt(argbFromHex(seed));
  const Scheme = SCHEMES[variant];
  const blocks: string[] = [];

  for (const mode of ["light", "dark"] as const) {
    for (const [suffix, level] of CONTRASTS) {
      const scheme = new Scheme(source, mode === "dark", level);
      const cls = suffix ? `${mode}-${suffix}-contrast` : mode;
      const decls = ROLES.map(
        (role) => `--md-sys-color-${kebab(role)}:${hexFromArgb(scheme[role])};`,
      ).join("");
      blocks.push(`html.${cls},html .${cls}{${decls}}`);
    }
  }
  return blocks.join("\n");
}

const STYLE_ID = "dynamic-palette";
export const CSS_CACHE_KEY = "vite-ui-palette-css";

export function applyPalette(seed: string | null, variant: PaletteVariant) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

  if (seed === null) {
    el?.remove();
    try {
      localStorage.removeItem(CSS_CACHE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  const css = buildPaletteCss(seed, variant);
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.append(el);
  }
  el.textContent = css;

  // Lets index.html apply the palette before React loads (no flash on reload)
  try {
    localStorage.setItem(CSS_CACHE_KEY, css);
  } catch {
    /* ignore */
  }
}

// Up to 4 good seed colors from an image, best first
export async function seedsFromImage(file: File): Promise<string[]> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 128 / Math.max(bitmap.width, bitmap.height)); // downscale: faster
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, w, h);
  const pixels: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 255) continue; // skip transparent pixels
    pixels.push(argbFromRgb(data[i], data[i + 1], data[i + 2]));
  }

  const ranked = Score.score(QuantizerCelebi.quantize(pixels, 128), { desired: 4 });
  return ranked.map(hexFromArgb);
}
