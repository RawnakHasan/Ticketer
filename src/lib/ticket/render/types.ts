import type { RGB, Stock } from "../color";
import type { FieldKey } from "../fields";
import type { BackdropId, LayoutId, TemplateId } from "../ids";
import type { MainShape, StubArea } from "../settings";
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
  ssc: number;
  layout: LayoutId;
  tilt: number;
  shadow: number;
  backdrop: BackdropId;
  inkOverride: RGB | null;
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
  render: (state: TicketState, scale: number) => Rendered;
};
