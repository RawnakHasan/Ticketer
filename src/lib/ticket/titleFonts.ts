import type { TitleFontId } from "./ids";

// The fonts a ticket's big text can use. `scale` evens out how large each one looks at the same
// size, because a script face reads much smaller than a condensed one.
export const TITLE_FONTS: Record<
  TitleFontId,
  { label: string; family: string; weight: number; scale: number }
> = {
  grotesk: { label: "Grotesk", family: '"Bricolage Grotesque"', weight: 800, scale: 1 },
  serif: { label: "Serif", family: '"Playfair Display"', weight: 800, scale: 1 },
  condensed: { label: "Condensed", family: '"Bebas Neue"', weight: 400, scale: 1.15 },
  rounded: { label: "Rounded", family: "Quicksand", weight: 700, scale: 1 },
  clean: { label: "Clean", family: "Montserrat", weight: 800, scale: 0.94 },
  script: { label: "Handwritten", family: "Caveat", weight: 600, scale: 1.2 },
  mono: { label: "Mono", family: '"DM Mono"', weight: 500, scale: 0.88 },
};

// Templates draw one ticket after another, all in one go, so the font is simply set before each
// one is drawn and read while it is being drawn.
let current: TitleFontId = "grotesk";

export const setTitleFont = (id: TitleFontId) => {
  current = id;
};

export function titleFont(size: number) {
  const { family, weight, scale } = TITLE_FONTS[current];
  return `${weight} ${+(size * scale).toFixed(2)}px ${family}`;
}

// What the browser has to load before the canvas can draw with each of them
export const TITLE_FONT_FACES = Object.values(TITLE_FONTS).map(
  ({ family, weight }) => `${weight} 40px ${family}`,
);
