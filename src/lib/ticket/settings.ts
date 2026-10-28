import { z } from "zod";

import { makeDefaultFields, makeDefaultShow } from "./fields";
import { BACKDROP_IDS, FX_IDS, LAYOUT_IDS, STOCK_IDS, TEMPLATE_IDS } from "./ids";

const rgbSchema = z.tuple([z.number(), z.number(), z.number()]);

const stubAreaSchema = z.object({
  layout: z.enum(["band", "square", "cover"]),
  h: z.number(),
  sq: z.number(),
  mw: z.number(),
  r: z.number(),
});

const mainShapeSchema = z.object({
  auto: z.boolean(),
  h: z.number(),
  w: z.number(),
  r: z.number(),
  b: z.number(),
  s: z.number(),
});

const adjustSchema = z.object({
  brightness: z.number(),
  contrast: z.number(),
  grayscale: z.boolean(),
  fx: z.enum(FX_IDS),
});

export type StubArea = z.infer<typeof stubAreaSchema>;
export type MainShape = z.infer<typeof mainShapeSchema>;
export type Adjust = z.infer<typeof adjustSchema>;

export const DEFAULT_STUB_AREA: StubArea = { layout: "band", h: 80, sq: 150, mw: 128, r: 16 };
export const DEFAULT_MAIN_SHAPE: MainShape = { auto: true, h: 100, w: 100, r: 22, b: 0, s: 100 };
export const DEFAULT_ADJUST: Adjust = {
  brightness: 100,
  contrast: 100,
  grayscale: false,
  fx: "none",
};

// Everything the person can change that survives a reload. Photos are not part of it.
// Every field has a default, so parsing {} gives the defaults and old saves keep working.
export const settingsSchema = z.object({
  tpl: z.enum(TEMPLATE_IDS).default("admit"),
  stock: z.enum(STOCK_IDS).default("light"),
  grain: z.boolean().default(true),
  notched: z.boolean().default(false),
  backdrop: z.enum(BACKDROP_IDS).default("grad"),
  layout: z.enum(LAYOUT_IDS).default("single"),
  tilt: z.number().default(0),
  shadow: z.number().default(100),
  accent: rgbSchema.nullable().default(null),
  ink: rgbSchema.nullable().default(null),
  stubArea: stubAreaSchema.default(() => ({ ...DEFAULT_STUB_AREA })),
  mainShape: mainShapeSchema.default(() => ({ ...DEFAULT_MAIN_SHAPE })),
  adjust: adjustSchema.default(() => ({ ...DEFAULT_ADJUST })),
  fields: z.record(z.string(), z.string()).default(makeDefaultFields),
  show: z.record(z.string(), z.boolean()).default(makeDefaultShow),
  presetId: z.string().default("ig45"),
  customW: z.number().default(1080),
  customH: z.number().default(1350),
  format: z.enum(["png", "jpg"]).default("png"),
  quality: z.number().default(92),
  scale: z.union([z.literal(1), z.literal(2)]).default(1),
  safeOverlay: z.boolean().default(true),
  transparent: z.boolean().default(false),
});

export type Settings = z.infer<typeof settingsSchema>;
