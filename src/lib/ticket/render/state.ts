import { autoInk, makeStock, type RGB, type Stock } from "../color";
import type { FieldKey } from "../fields";
import type { StockId, TemplateId } from "../ids";
import { buildPalette, ensureContrast, type PhotoPalette } from "../palette";
import type { Settings } from "../settings";
import type { Sticker } from "../sticker";
import type { Photo } from "../types";
import { mainFrame } from "./frame";
import { TEMPLATES } from "./templates";
import type { TicketState } from "./types";

export type Photos = { main: Photo | null; stub: Photo | null; stickers?: readonly Sticker[] };

// Things that change how a ticket is drawn without being saved settings
export type ViewOptions = {
  // Draw this template instead of the saved one (used by "recompose")
  tpl?: TemplateId;
  back?: boolean;
  // Stamp scale while it thumps
  stampScale?: number;
  // Sticker to outline in the preview
  selectedSticker?: string | null;
};

const FX: Record<Settings["adjust"]["fx"], string> = {
  none: "",
  warm: "sepia(.28) saturate(1.2)",
  cool: "hue-rotate(-14deg) saturate(1.1)",
  film: "contrast(1.08) sepia(.18) saturate(.9)",
  noir: "grayscale(1) contrast(1.15)",
};

export const photoFilter = (adjust: Settings["adjust"]) =>
  `brightness(${adjust.brightness}%) contrast(${adjust.contrast}%) grayscale(${adjust.grayscale ? 1 : 0}) ${FX[adjust.fx]}`;

// The colours for one paper stock: its own paper and text, the accent, then whatever the person
// picked by hand. The second text colour comes from the stub photo's colours once there is one.
function stockFor(
  id: StockId,
  accent: RGB,
  palette: PhotoPalette,
  settings: Settings,
  hasStub: boolean,
): Stock {
  let st = makeStock(id, accent, id === "photo" ? palette : null);

  if (settings.paper) st = { ...st, paper: settings.paper, alpha: 1, ink: autoInk(settings.paper) };
  if (settings.ink) st = { ...st, ink: settings.ink };

  if (settings.ink2) {
    st = { ...st, ink2: settings.ink2 };
  } else if (!settings.ink && (hasStub || id === "photo" || settings.shuffle > 0)) {
    // Checked against the paper actually in use, which may be a fixed stock or a hand-picked one
    st = { ...st, ink2: ensureContrast(palette.ink2, st.paper, 4.5) };
  }
  return st;
}

// Turns the saved settings and the current photos into what a template draws
export function buildTicketState(
  settings: Settings,
  photos: Photos,
  view: ViewOptions = {},
): TicketState {
  const tpl = view.tpl ?? settings.tpl;
  const template = TEMPLATES[tpl];
  const palette = buildPalette(photos.main, photos.stub, settings.shuffle);
  const accent = settings.accent ?? palette.acc;
  const hasStub = photos.stub !== null;
  const mkStock = (id: StockId) => stockFor(id, accent, palette, settings, hasStub);
  const [, , dy] = mainFrame(
    template.photoBox,
    settings.mainShape,
    photos.main,
    settings.stubArea.mw,
  );

  return {
    tpl,
    main: photos.main,
    // The stub falls back to the main photo until a separate one is added
    stub: photos.stub ?? photos.main,
    f: settings.fields as Record<FieldKey, string>,
    show: settings.show,
    st: mkStock(settings.stock),
    acc: accent,
    flt: photoFilter(settings.adjust),
    grain: settings.grain,
    corn: settings.notched,
    sa: settings.stubArea,
    mp: settings.mainShape,
    dy,
    sp: settings.stampPos,
    ssc: view.stampScale ?? 1,
    back: view.back ?? false,
    prog: settings.progress,
    layout: settings.layout,
    tilt: settings.tilt,
    shadow: settings.shadow,
    backdrop: settings.backdrop,
    mkStock,
    stickers: photos.stickers ?? [],
    selectedSticker: view.selectedSticker ?? null,
  };
}
