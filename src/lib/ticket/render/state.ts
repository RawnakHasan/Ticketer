import { makeStock, withInk, type RGB } from "../color";
import type { FieldKey } from "../fields";
import { dominantColor } from "../photo";
import type { Settings } from "../settings";
import type { Photo } from "../types";
import { mainFrame } from "./frame";
import { TEMPLATES } from "./templates";
import type { TicketState } from "./types";

export type Photos = { main: Photo | null; stub: Photo | null };

const FX: Record<Settings["adjust"]["fx"], string> = {
  none: "",
  warm: "sepia(.28) saturate(1.2)",
  cool: "hue-rotate(-14deg) saturate(1.1)",
  film: "contrast(1.08) sepia(.18) saturate(.9)",
  noir: "grayscale(1) contrast(1.15)",
};

const FALLBACK_ACCENT: RGB = [194, 68, 30];

export const photoFilter = (adjust: Settings["adjust"]) =>
  `brightness(${adjust.brightness}%) contrast(${adjust.contrast}%) grayscale(${adjust.grayscale ? 1 : 0}) ${FX[adjust.fx]}`;

// Turns the saved settings and the current photos into what a template draws
export function buildTicketState(settings: Settings, photos: Photos): TicketState {
  const template = TEMPLATES[settings.tpl];
  const accent =
    settings.accent ?? (photos.main ? dominantColor(photos.main.bmp) : FALLBACK_ACCENT);
  const [, , dy] = mainFrame(
    template.photoBox,
    settings.mainShape,
    photos.main,
    settings.stubArea.mw,
  );

  return {
    tpl: settings.tpl,
    main: photos.main,
    // The stub falls back to the main photo until a separate one is added
    stub: photos.stub ?? photos.main,
    f: settings.fields as Record<FieldKey, string>,
    show: settings.show,
    st: withInk(makeStock(settings.stock, accent), settings.ink),
    acc: accent,
    flt: photoFilter(settings.adjust),
    grain: settings.grain,
    corn: settings.notched,
    sa: settings.stubArea,
    mp: settings.mainShape,
    dy,
    sp: null,
    ssc: 1,
    layout: settings.layout,
    tilt: settings.tilt,
    shadow: settings.shadow,
    backdrop: settings.backdrop,
    inkOverride: settings.ink,
  };
}
