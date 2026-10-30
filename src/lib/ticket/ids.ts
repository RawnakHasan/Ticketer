// Plain id lists, so the settings schema can use them without importing any renderer code.
// Add a template id here when its renderer is registered in render/templates.ts.
export const TEMPLATE_IDS = [
  "admit",
  "museum",
  "player",
  "boarding",
  "concert",
  "cinema",
  "polaroid",
  "calendar",
  "stamp",
  "receipt",
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const STOCK_IDS = [
  "light",
  "dark",
  "vellum",
  "tint",
  "kraft",
  "navy",
  "sage",
  "rose",
  // Paper colour taken from the photos (see palette.ts)
  "photo",
] as const;
export type StockId = (typeof STOCK_IDS)[number];

export const BACKDROP_IDS = ["grad", "flow", "aurora", "plain", "blur"] as const;
export type BackdropId = (typeof BACKDROP_IDS)[number];

export const FX_IDS = ["none", "warm", "cool", "film", "noir"] as const;
export type FxId = (typeof FX_IDS)[number];

export const LAYOUT_IDS = ["single", "twin", "var"] as const;
export type LayoutId = (typeof LAYOUT_IDS)[number];

// Backdrops that move in the app. Exports capture the frame on screen.
export const ANIMATED_BACKDROPS: readonly BackdropId[] = ["flow", "aurora"];
export const isAnimatedBackdrop = (id: BackdropId) => ANIMATED_BACKDROPS.includes(id);

export const SIDE_IDS = ["front", "back"] as const;
export type SideId = (typeof SIDE_IDS)[number];

export const EXPORT_SIDE_IDS = ["front", "back", "both"] as const;
export type ExportSideId = (typeof EXPORT_SIDE_IDS)[number];

export const TITLE_FONT_IDS = [
  "grotesk",
  "serif",
  "condensed",
  "rounded",
  "clean",
  "script",
  "mono",
] as const;
export type TitleFontId = (typeof TITLE_FONT_IDS)[number];
