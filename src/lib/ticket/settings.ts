import { z } from "zod";

import { makeDefaultFields, makeDefaultShow } from "./fields";
import { BACKDROP_IDS, EXPORT_SIDE_IDS, FX_IDS, LAYOUT_IDS, STOCK_IDS, TEMPLATE_IDS } from "./ids";

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
  // Backdrop motion (flow and aurora only)
  speed: z.number().default(1),
  paused: z.boolean().default(false),
  // Player card: how far along the track is, in percent
  progress: z.number().default(35),
  // Where the stamp sits as a fraction of the ticket. null = the template's own spot.
  stampPos: z.object({ x: z.number(), y: z.number() }).nullable().default(null),
  // Pick the best template for each export size, unless that template was chosen on purpose
  recompose: z.boolean().default(false),
  // "<presetId>:<templateId>" entries the person picked by hand, so recompose leaves them alone
  keep: z.record(z.string(), z.boolean()).default(() => ({})),
  exportSide: z.enum(EXPORT_SIDE_IDS).default("front"),
  // Colours picked by hand. null = worked out automatically from the photos and the paper.
  accent: rgbSchema.nullable().default(null),
  ink: rgbSchema.nullable().default(null),
  paper: rgbSchema.nullable().default(null),
  ink2: rgbSchema.nullable().default(null),
  // Which roll of the colour dice the "photo" paper is on. 0 = the calm automatic one.
  shuffle: z.number().int().min(0).default(0),
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
