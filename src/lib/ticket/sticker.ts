import { materialShapePath, type MaterialShapeName } from "../shapes/materialShapes";
import { loadPhoto, drawCover, shownAspect } from "./photo";
import type { Photo } from "./types";

// "cutout" keeps the picture's own outline (a transparent PNG). A shape name crops the photo into it.
export type StickerShape = MaterialShapeName | "cutout";

export type Sticker = {
  id: string;
  // Decoded once. Its zoom, pan and turns are the crop used inside a shape.
  photo: Photo;
  shape: StickerShape;
  // The picture has see-through parts, so it is offered as a cutout first
  hasAlpha: boolean;
  // Centre of the sticker, as a fraction of the ticket's width and height
  x: number;
  y: number;
  // Longest side, as a fraction of the ticket's width
  size: number;
  // Degrees
  rot: number;
  // White die-cut edge, like a real sticker
  border: boolean;
  // Mirrored left to right
  flip: boolean;
};

// Which centre lines a moving sticker is snapped to, for the preview's guide lines
export type StickerGuides = { x: boolean; y: boolean };

export const MAX_STICKERS = 12;
export const DEFAULT_PHOTO_SHAPE: MaterialShapeName = "cookie9";

// Pixels along the longest side of the finished sprite, and the room left round it for the edge
const SPRITE = 640;
const MARGIN = Math.round(SPRITE * 0.07);
const INNER = SPRITE - 2 * MARGIN;

function hasTransparency(bmp: ImageBitmap) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const g = canvas.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(bmp, 0, 0, 64, 64);
  const data = g.getImageData(0, 0, 64, 64).data;
  let clear = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) clear++;
  return clear > 64 * 64 * 0.01;
}

// `index` is how many stickers there already are, so new ones don't land exactly on top of each other
export async function loadSticker(file: File, index: number): Promise<Sticker> {
  const photo = await loadPhoto(file);
  const hasAlpha = hasTransparency(photo.bmp);
  const step = index % 3;

  return {
    id: crypto.randomUUID(),
    photo,
    shape: hasAlpha ? "cutout" : DEFAULT_PHOTO_SHAPE,
    hasAlpha,
    x: 0.74 - step * 0.08,
    y: 0.3 + step * 0.06,
    size: 0.3,
    rot: 0,
    border: true,
    flip: false,
  };
}

// Pixel size of the sprite: square for a shape, the picture's own proportions for a cutout
function spriteSize(s: Sticker): [number, number] {
  if (s.shape !== "cutout") return [SPRITE, SPRITE];
  const a = shownAspect(s.photo);
  const w = a >= 1 ? INNER : INNER * a;
  const h = a >= 1 ? INNER / a : INNER;
  return [Math.round(w) + 2 * MARGIN, Math.round(h) + 2 * MARGIN];
}

const sprites = new Map<string, { key: string; canvas: HTMLCanvasElement }>();

export function dropSprite(id: string) {
  sprites.delete(id);
}

// Everything that changes how the sprite looks. When it changes, the sprite is drawn again.
const spriteKey = (s: Sticker) =>
  [s.photo.id, s.photo.z, s.photo.x, s.photo.y, s.photo.rot, s.shape, s.border].join("|");

function buildSprite(s: Sticker): HTMLCanvasElement {
  const [w, h] = spriteSize(s);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  const edge = MARGIN * 0.8;

  if (s.shape === "cutout") {
    // Always the whole picture, whatever crop was set for a shape
    const whole: Photo = { ...s.photo, z: 1, x: 0, y: 0 };
    const iw = w - 2 * MARGIN;
    const ih = h - 2 * MARGIN;

    if (s.border) {
      // The picture turned into a white silhouette, stamped all the way round it
      const sil = document.createElement("canvas");
      sil.width = w;
      sil.height = h;
      const sg = sil.getContext("2d")!;
      drawCover(sg, whole, MARGIN, MARGIN, iw, ih, 0);
      sg.globalCompositeOperation = "source-in";
      sg.fillStyle = "#fff";
      sg.fillRect(0, 0, w, h);

      for (const reach of [edge * 0.5, edge]) {
        for (let i = 0; i < 28; i++) {
          const a = (i / 28) * Math.PI * 2;
          g.drawImage(sil, Math.cos(a) * reach, Math.sin(a) * reach);
        }
      }
    }
    drawCover(g, whole, MARGIN, MARGIN, iw, ih, 0);
    return canvas;
  }

  const path = new Path2D(materialShapePath(s.shape));
  const half = INNER / 2;

  if (s.border) {
    g.save();
    g.translate(w / 2, h / 2);
    g.scale(half, half);
    g.fillStyle = g.strokeStyle = "#fff";
    g.lineJoin = "round";
    g.lineWidth = (2 * edge) / half;
    g.fill(path);
    g.stroke(path);
    g.restore();
  }

  g.save();
  g.translate(w / 2, h / 2);
  g.scale(half, half);
  g.clip(path);
  g.setTransform(1, 0, 0, 1, 0, 0);
  drawCover(g, s.photo, MARGIN, MARGIN, INNER, INNER, 0);
  g.restore();
  return canvas;
}

// The finished picture of one sticker, drawn once and reused until something about it changes
export function getSprite(s: Sticker): HTMLCanvasElement {
  const key = spriteKey(s);
  const hit = sprites.get(s.id);
  if (hit && hit.key === key) return hit.canvas;

  const canvas = buildSprite(s);
  sprites.set(s.id, { key, canvas });
  return canvas;
}

// On-ticket size of a sticker in pixels of a ticket `width` wide
function drawnSize(s: Sticker, width: number): [number, number] {
  const [w, h] = spriteSize(s);
  const k = (s.size * width) / Math.max(w, h);
  return [w * k, h * k];
}

// Size of the round handles, as a fraction of the ticket's width, and how far the rotate knob
// sits above the sticker
const HANDLE = 0.028;
const KNOB_GAP = 0.07;

// Where the corners and the rotate knob of a sticker are, in ticket units
function handlePoints(s: Sticker, w: number, h: number) {
  const [dw, dh] = drawnSize(s, w);
  const a = (s.rot * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const at = (lx: number, ly: number) => ({
    x: s.x * w + lx * cos - ly * sin,
    y: s.y * h + lx * sin + ly * cos,
  });
  return {
    corners: [at(-dw / 2, -dh / 2), at(dw / 2, -dh / 2), at(dw / 2, dh / 2), at(-dw / 2, dh / 2)],
    knob: at(0, -dh / 2 - KNOB_GAP * w),
  };
}

// Paints the stickers onto a finished ticket. "source-atop" only paints where the ticket already
// is, so the tear notches and cut corners stay cut out. `selectedId` gets a dashed outline with
// handles, and `guides` the centre lines it is snapped to. Both are for the preview only.
// Exports never pass them.
export function drawStickers(
  canvas: HTMLCanvasElement,
  stickers: readonly Sticker[],
  selectedId: string | null = null,
  guides: StickerGuides | null = null,
) {
  if (!stickers.length) return;

  const c = canvas.getContext("2d")!;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);

  c.globalCompositeOperation = "source-atop";
  for (const s of stickers) {
    const [dw, dh] = drawnSize(s, canvas.width);
    const longest = Math.max(dw, dh);
    c.save();
    c.translate(s.x * canvas.width, s.y * canvas.height);
    c.rotate((s.rot * Math.PI) / 180);
    c.scale(s.flip ? -1 : 1, 1);
    c.shadowColor = "rgba(0,0,0,.32)";
    c.shadowBlur = longest * 0.045;
    c.shadowOffsetY = longest * 0.018;
    c.drawImage(getSprite(s), -dw / 2, -dh / 2, dw, dh);
    c.restore();
  }

  c.globalCompositeOperation = "source-over";
  const unit = Math.max(2, canvas.width / 300);

  if (guides && (guides.x || guides.y)) {
    c.setLineDash([unit * 4, unit * 3]);
    for (const [style, width] of [
      ["#fff", unit * 2.4],
      ["#ff2d95", unit * 1.2],
    ] as const) {
      c.strokeStyle = style;
      c.lineWidth = width;
      c.beginPath();
      if (guides.x) {
        c.moveTo(canvas.width / 2, 0);
        c.lineTo(canvas.width / 2, canvas.height);
      }
      if (guides.y) {
        c.moveTo(0, canvas.height / 2);
        c.lineTo(canvas.width, canvas.height / 2);
      }
      c.stroke();
    }
    c.setLineDash([]);
  }

  const selected = stickers.find((s) => s.id === selectedId);
  if (selected) {
    const [dw, dh] = drawnSize(selected, canvas.width);
    c.save();
    c.translate(selected.x * canvas.width, selected.y * canvas.height);
    c.rotate((selected.rot * Math.PI) / 180);
    c.setLineDash([unit * 5, unit * 4]);
    // Dark under light, so the outline shows on any paper
    for (const [style, width] of [
      ["rgba(0,0,0,.55)", unit * 2.4],
      ["#fff", unit * 1.2],
    ] as const) {
      c.strokeStyle = style;
      c.lineWidth = width;
      c.strokeRect(-dw / 2, -dh / 2, dw, dh);
    }
    c.restore();

    // Round handles: the corners resize, the knob on its stalk rotates
    const { corners, knob } = handlePoints(selected, canvas.width, canvas.height);
    const r = canvas.width * HANDLE;
    const top = corners[0];
    const topRight = corners[1];
    c.setLineDash([]);
    c.strokeStyle = "#fff";
    c.lineWidth = unit * 1.4;
    c.beginPath();
    c.moveTo((top.x + topRight.x) / 2, (top.y + topRight.y) / 2);
    c.lineTo(knob.x, knob.y);
    c.stroke();

    for (const [i, point] of [...corners, knob].entries()) {
      c.beginPath();
      c.arc(point.x, point.y, r * (i === 4 ? 1.15 : 1), 0, Math.PI * 2);
      c.fillStyle = i === 4 ? "#ff2d95" : "#fff";
      c.fill();
      c.lineWidth = unit * 1.2;
      c.strokeStyle = "rgba(0,0,0,.6)";
      c.stroke();
    }
  }
  c.restore();
}

// Which handle of a sticker is under a point, if any. `slack` is extra reach in ticket units, so
// a fingertip can still find a handle that is drawn small.
export function hitHandle(
  s: Sticker,
  x: number,
  y: number,
  w: number,
  h: number,
  slack = 0,
): "resize" | "rotate" | null {
  const { corners, knob } = handlePoints(s, w, h);
  const reach = Math.max(w * HANDLE * 1.5, slack);
  const near = (p: { x: number; y: number }) => Math.hypot(x * w - p.x, y * h - p.y) <= reach;
  if (near(knob)) return "rotate";
  return corners.some(near) ? "resize" : null;
}

// The topmost sticker under a point. Point and sizes are on the ticket, in the same units
// (`w` and `h` are the ticket's width and height), and x and y are fractions of them.
export function hitSticker(
  stickers: readonly Sticker[],
  x: number,
  y: number,
  w: number,
  h: number,
): Sticker | null {
  for (let i = stickers.length - 1; i >= 0; i--) {
    const s = stickers[i];
    const [dw, dh] = drawnSize(s, w);
    const a = (-s.rot * Math.PI) / 180;
    const px = (x - s.x) * w;
    const py = (y - s.y) * h;
    const lx = px * Math.cos(a) - py * Math.sin(a);
    const ly = px * Math.sin(a) + py * Math.cos(a);
    if (Math.abs(lx) <= dw / 2 && Math.abs(ly) <= dh / 2) return s;
  }
  return null;
}
