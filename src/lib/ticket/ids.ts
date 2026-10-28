// Plain id lists, so the settings schema can use them without importing any renderer code.
// Add a template id here when its renderer is registered in render/templates.ts.
export const TEMPLATE_IDS = ["admit"] as const;
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
] as const;
export type StockId = (typeof STOCK_IDS)[number];

export const BACKDROP_IDS = ["grad", "plain", "blur"] as const;
export type BackdropId = (typeof BACKDROP_IDS)[number];

export const FX_IDS = ["none", "warm", "cool", "film", "noir"] as const;
export type FxId = (typeof FX_IDS)[number];

export const LAYOUT_IDS = ["single", "twin", "var"] as const;
export type LayoutId = (typeof LAYOUT_IDS)[number];
