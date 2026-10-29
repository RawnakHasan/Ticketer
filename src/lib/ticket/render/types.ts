import type { RGB, Stock } from "../color";
import type { FieldKey } from "../fields";
import type { BackdropId, LayoutId, StockId, TemplateId } from "../ids";
import type { MainShape, StubArea } from "../settings";
import type { Sticker } from "../sticker";
import type { Photo } from "../types";

// What a template needs to draw one ticket. Built from the settings by buildTicketState.
export type TicketState = {
  tpl: TemplateId;
  main: Photo | null;
  stub: Photo | null;
  f: Record<FieldKey, string>;
  show: Record<string, boolean>;
  st: Stock;
  acc: RGB;
  // The CSS filter applied to photos
  flt: string;
  grain: boolean;
  corn: boolean;
  sa: StubArea;
  mp: MainShape;
  // How much taller than its base height the ticket is (from the main photo shape)
  dy: number;
  // Stamp position as a fraction of the ticket, or null for the template default
  sp: { x: number; y: number } | null;
  // Stamp scale, for the thump when it is placed
  ssc: number;
  // Draw the back of the ticket instead of the front
  back: boolean;
  // Player card: playback position in percent
  prog: number;
  layout: LayoutId;
  tilt: number;
  shadow: number;
  backdrop: BackdropId;
  // Builds the colours for a paper stock with this ticket's accent and hand-picked colours.
  // The variations layout uses it to show the same ticket on other paper.
  mkStock: (id: StockId) => Stock;
  // Drawn on top of the front of every ticket
  stickers: readonly Sticker[];
  // Gets a dashed outline in the preview. Always null for exports.
  selectedSticker: string | null;
};

export type Rendered = { canvas: HTMLCanvasElement; warnings: string[] };

export type Template = {
  id: TemplateId;
  label: string;
  description: string;
  // Base size in design units
  size: readonly [width: number, height: number];
  // The main photo frame: [width, height, min scale, max scale]
  photoBox: readonly [number, number, number, number];
  // Width over height of the stub photo, for the crop in the upload step
  stubRatio: (sa: StubArea) => number;
  // Which stub photo controls the Style step shows: the admit stub styles, a photo width, or none
  stubControls: "styles" | "width" | "none";
  // False when the template never draws the stub photo (it still leads the second ticket in "Two, angled")
  usesStub: boolean;
  render: (state: TicketState, scale: number) => Rendered;
};
