import { composeTicket } from "./compose";
import { drawPoster } from "./render/drawPoster";
import type { Photos } from "./render/state";
import type { Settings } from "./settings";
import type { PosterFile } from "./export";
import { buildPdf, type PdfImage, type PdfPage } from "./pdf";

export type SheetOptions = {
  paper: "a4" | "letter";
  // Width of one printed ticket
  ticketWidthMm: number;
  copies: number;
  cropMarks: boolean;
};

const PAPER_MM = { a4: [210, 297], letter: [215.9, 279.4] } as const;
const MARGIN_MM = 10;
const GAP_MM = 6;
const DPI = 300;
const PT_PER_MM = 72 / 25.4;
const MAX_PX = 2400;

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "ticket";

// One side of the ticket on its own, as a JPEG at print resolution. The corners and tear notches
// are see-through on screen, so they are filled white for paper.
async function ticketJpeg(
  settings: Settings,
  photos: Photos,
  back: boolean,
  widthPx: number,
): Promise<PdfImage> {
  const { state, preset } = composeTicket(settings, photos, { back });
  const heightPx = Math.round((widthPx * preset.h) / preset.w);

  const ticket = document.createElement("canvas");
  ticket.width = widthPx;
  ticket.height = heightPx;
  drawPoster(ticket, preset, state, { transparent: true });

  const page = document.createElement("canvas");
  page.width = widthPx;
  page.height = heightPx;
  const g = page.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, widthPx, heightPx);
  g.drawImage(ticket, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) =>
    page.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not make the picture."))),
      "image/jpeg",
      0.92,
    ),
  );
  return { jpeg: new Uint8Array(await blob.arrayBuffer()), width: widthPx, height: heightPx };
}

// Tickets at real size on A4 or Letter pages, with crop marks. With both sides the pages
// alternate front, back, front, back, and the back pages are mirrored so that printing
// double-sided (flipped on the long edge) puts each back behind its front.
export async function renderPrintSheet(
  settings: Settings,
  photos: Photos,
  options: SheetOptions,
): Promise<PosterFile> {
  await document.fonts.ready;

  // One ticket per print, whatever layout the poster uses
  const single: Settings = { ...settings, presetId: "ticket", layout: "single", tilt: 0 };
  const sides = settings.exportSide === "both" ? ["front", "back"] : [settings.exportSide];

  const [paperW, paperH] = PAPER_MM[options.paper];
  const aspect = composeTicket(single, photos).preset;
  const ratio = aspect.h / aspect.w;

  // The ticket is never wider or taller than the page allows
  const widthMm = Math.min(
    options.ticketWidthMm,
    paperW - 2 * MARGIN_MM,
    (paperH - 2 * MARGIN_MM) / ratio,
  );
  const heightMm = widthMm * ratio;

  const cols = Math.max(1, Math.floor((paperW - 2 * MARGIN_MM + GAP_MM) / (widthMm + GAP_MM)));
  const rows = Math.max(1, Math.floor((paperH - 2 * MARGIN_MM + GAP_MM) / (heightMm + GAP_MM)));
  const perPage = cols * rows;
  const x0 = (paperW - (cols * widthMm + (cols - 1) * GAP_MM)) / 2;
  const y0 = (paperH - (rows * heightMm + (rows - 1) * GAP_MM)) / 2;

  const widthPx = Math.min(MAX_PX, Math.round((widthMm / 25.4) * DPI));
  const images: PdfImage[] = [];
  for (const side of sides) images.push(await ticketJpeg(single, photos, side === "back", widthPx));

  const pages: PdfPage[] = [];
  const pageCount = Math.ceil(options.copies / perPage);
  for (let p = 0; p < pageCount; p++) {
    const onPage = Math.min(perPage, options.copies - p * perPage);
    for (const side of sides) {
      const page: PdfPage = { placements: [], lines: [] };
      for (let i = 0; i < onPage; i++) {
        const row = Math.floor(i / cols);
        // Mirrored across the page for the back, so it lines up behind the front when flipped
        const col = side === "back" ? cols - 1 - (i % cols) : i % cols;
        const left = x0 + col * (widthMm + GAP_MM);
        const top = y0 + row * (heightMm + GAP_MM);
        page.placements.push({
          image: sides.indexOf(side),
          x: left * PT_PER_MM,
          y: top * PT_PER_MM,
          w: widthMm * PT_PER_MM,
          h: heightMm * PT_PER_MM,
        });

        if (options.cropMarks) {
          const near = 1;
          const length = 3;
          for (const [cx, dx] of [
            [left, -1],
            [left + widthMm, 1],
          ] as const) {
            for (const [cy, dy] of [
              [top, -1],
              [top + heightMm, 1],
            ] as const) {
              page.lines.push(
                [cx + dx * near, cy, cx + dx * (near + length), cy].map(
                  (v) => v * PT_PER_MM,
                ) as PdfPage["lines"][number],
                [cx, cy + dy * near, cx, cy + dy * (near + length)].map(
                  (v) => v * PT_PER_MM,
                ) as PdfPage["lines"][number],
              );
            }
          }
        }
      }
      pages.push(page);
    }
  }

  const blob = buildPdf(paperW * PT_PER_MM, paperH * PT_PER_MM, images, pages);
  return {
    blob,
    type: "application/pdf",
    filename: `ticketer-${slug(settings.fields.title ?? "")}-print-sheet.pdf`,
  };
}
