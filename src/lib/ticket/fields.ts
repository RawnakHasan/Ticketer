import type { TemplateId } from "./ids";

// `show` is the key of the on/off switch. The QR link field is switched by "qr".
export const FIELDS = [
  { key: "title", label: "Title" },
  { key: "sub", label: "Subtitle" },
  { key: "name", label: "Admit one name" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "place", label: "Place" },
  { key: "tier", label: "Tier label" },
  { key: "price", label: "Price or label" },
  { key: "serial", label: "Serial number" },
  { key: "fine", label: "Fine print" },
  { key: "cap", label: "Handwritten caption" },
  { key: "handle", label: "Handle or hashtag" },
  { key: "from", label: "Route from (code · city)", only: "boarding" },
  { key: "to", label: "Route to (code · city)", only: "boarding" },
  { key: "x1", label: "Custom field 1 (Label: value)", only: "boarding" },
  { key: "x2", label: "Custom field 2 (Label: value)", only: "boarding" },
  { key: "x3", label: "Custom field 3 (Label: value)", only: "boarding" },
  { key: "lines", label: "Side panel lines (| = new line)", only: "player" },
  { key: "dur", label: "Track length (m:ss)", only: "player" },
  { key: "url", label: "QR link (blank = decorative)", show: "qr" },
] as const satisfies readonly {
  key: string;
  label: string;
  show?: string;
  only?: string;
}[];

export type FieldKey = (typeof FIELDS)[number]["key"];
export type FieldDef = { key: FieldKey; label: string; show?: string; only?: string };

export const showKeyOf = (field: FieldDef) => field.show ?? field.key;

export const fieldsFor = (tpl: TemplateId): FieldDef[] =>
  (FIELDS as readonly FieldDef[]).filter((field) => !field.only || field.only === tpl);

export const makeSerial = () => `TK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const DEFAULT_TEXT: Record<FieldKey, string> = {
  title: "Salt & Static",
  sub: "An evening of tide recordings",
  name: "Marlow Quince",
  date: "14 NOV 2026",
  time: "19:30",
  place: "Pier Nine Hall, Harbourgate",
  tier: "Front Row",
  price: "€24",
  serial: "",
  fine: "Valid for one entry. Non-transferable. No refunds.",
  cap: "the night the tide came in loud",
  handle: "@saltandstatic",
  from: "HBG · Harbourgate",
  to: "NVK · Novakeld",
  x1: "Gate: 14",
  x2: "Seat: 7C",
  x3: "Zone: Window",
  lines: "rainy day mix|for the long ride home",
  dur: "3:47",
  url: "",
};

export const makeDefaultFields = (): Record<FieldKey, string> => ({
  ...DEFAULT_TEXT,
  serial: makeSerial(),
});

export const makeDefaultShow = (): Record<string, boolean> => ({
  ...Object.fromEntries((FIELDS as readonly FieldDef[]).map((f) => [showKeyOf(f), true])),
  stamp: true,
});

export const SAMPLES = [
  ["Velvet Hours", "A listening room for night owls", "Hollow Room, Mirren Quay"],
  ["Paper Lanterns", "Open-air film in the orchard", "Quince Orchard, Eddlebrook"],
  ["Low Tide Radio", "Live sets from the old pier", "Pier Nine Hall, Harbourgate"],
  ["Ember & Oak", "A winter tasting menu", "The Cooperage, Brindle Row"],
  ["Static Bloom", "Gallery after dark", "Gallery Fourteen, Vale St."],
] as const;
