import { z } from "zod";

export const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

export const paletteVariants = [
  "tonalSpot",
  "vibrant",
  "expressive",
  "neutral",
  "monochrome",
  "fidelity",
  "content",
  "rainbow",
  "fruitSalad",
] as const;

export type PaletteVariant = (typeof paletteVariants)[number];

export const variantLabels: Record<PaletteVariant, string> = {
  tonalSpot: "Tonal spot",
  vibrant: "Vibrant",
  expressive: "Expressive",
  neutral: "Neutral",
  monochrome: "Monochrome",
  fidelity: "Fidelity",
  content: "Content",
  rainbow: "Rainbow",
  fruitSalad: "Fruit salad",
};

export const paletteSchema = z.object({
  seed: hexColor.nullable(), // null = use the static default CSS
  variant: z.enum(paletteVariants),
});
