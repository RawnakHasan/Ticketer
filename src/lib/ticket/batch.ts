import { extensionOf, renderImage, type ImageType, type PosterFile } from "./export";
import { FIELDS, makeSerial, type FieldKey } from "./fields";
import type { Photos } from "./render/state";
import type { Settings } from "./settings";

// One ticket per row of a list: the first row names the columns, and each column fills the
// ticket field of the same name. Anything the list does not fill keeps what is on the ticket now.

export const MAX_ROWS = 300;

// Reads comma, semicolon or tab separated text, with "quoted, cells" and "" for a quote inside one
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const count = (char: string) => firstLine.split(char).length - 1;
  const delimiter = [",", ";", "\t"].reduce((best, c) => (count(c) > count(best) ? c : best), ",");

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }

  // Blank lines are not tickets
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const plain = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "");

// Other names for a field that people are likely to use as a column heading
const ALIASES: Record<string, FieldKey> = {
  subtitle: "sub",
  guest: "name",
  attendee: "name",
  holder: "name",
  venue: "place",
  location: "place",
  type: "tier",
  category: "tier",
  cost: "price",
  number: "serial",
  ticketno: "serial",
  ticketnumber: "serial",
  code: "serial",
  id: "serial",
  hashtag: "handle",
  link: "url",
  qr: "url",
  qrlink: "url",
};

// The boarding pass has three custom fields that are written as "Label: value", so these
// headings fill them with the label added
const LABELLED: Record<string, { key: FieldKey; label: string }> = {
  gate: { key: "x1", label: "Gate" },
  seat: { key: "x2", label: "Seat" },
  zone: { key: "x3", label: "Zone" },
};

export type ColumnMap = {
  // Column index to the field it fills, and the label put in front of each value, if any
  used: { index: number; heading: string; key: FieldKey; label?: string }[];
  ignored: string[];
};

export function mapColumns(header: string[]): ColumnMap {
  const byName = new Map<string, FieldKey>();
  for (const { key, label } of FIELDS) {
    byName.set(plain(key), key);
    byName.set(plain(label), key);
  }
  for (const [alias, key] of Object.entries(ALIASES)) byName.set(alias, key);

  const used: ColumnMap["used"] = [];
  const ignored: string[] = [];
  const taken = new Set<FieldKey>();
  header.forEach((heading, index) => {
    const labelled = LABELLED[plain(heading)];
    const key = labelled?.key ?? byName.get(plain(heading));
    // Two columns for one field: the first one wins
    if (key && !taken.has(key)) {
      taken.add(key);
      used.push({ index, heading: heading.trim(), key, label: labelled?.label });
    } else if (heading.trim()) {
      ignored.push(heading.trim());
    }
  });
  return { used, ignored };
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

const nextTurn = () => new Promise<void>((resolve) => setTimeout(resolve));

// Makes every ticket in the list and packs them into one zip. `onProgress` is told how many are
// done, and aborting the signal stops after the ticket being drawn.
export async function renderBatch(
  settings: Settings,
  photos: Photos,
  rows: string[][],
  onProgress: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<PosterFile> {
  const [header, ...records] = rows;
  if (!header || !records.length)
    throw new Error("The list needs a heading row and at least one ticket.");
  if (records.length > MAX_ROWS) throw new Error(`Up to ${MAX_ROWS} tickets at a time.`);

  const { used } = mapColumns(header);
  if (!used.length) {
    throw new Error(
      "None of the headings match a ticket field. Try name, date, time, place or title.",
    );
  }
  const fillsSerial = used.some((column) => column.key === "serial");

  await document.fonts.ready;
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  const type: ImageType = settings.format === "jpg" ? "image/jpeg" : "image/png";
  const sides = settings.exportSide === "both" ? [false, true] : [settings.exportSide === "back"];
  const width = String(records.length).length;

  for (const [n, record] of records.entries()) {
    if (signal?.aborted) throw new Error("Stopped.");

    const fields: Record<string, string> = { ...settings.fields };
    for (const { index, key, label } of used) {
      const value = (record[index] ?? "").trim();
      if (value) fields[key] = label ? `${label}: ${value}` : value;
    }
    // Every ticket gets its own number unless the list has one
    if (!fillsSerial) fields.serial = makeSerial();

    const label = slug(fields.name ?? "") || slug(fields.title ?? "") || "ticket";
    for (const back of sides) {
      const blob = await renderImage({ ...settings, fields }, photos, type, back);
      const side = sides.length > 1 ? (back ? "-back" : "-front") : "";
      zip.file(`${String(n + 1).padStart(width, "0")}-${label}${side}.${extensionOf(type)}`, blob);
    }
    onProgress(n + 1, records.length);
    await nextTurn();
  }

  return {
    blob: await zip.generateAsync({ type: "blob", compression: "STORE" }),
    filename: `ticketer-${slug(settings.fields.title ?? "") || "tickets"}-batch.zip`,
    type: "application/zip",
  };
}
