import { clamp } from "./math";
import type { RGB } from "./color";
import type { Photo } from "./types";

const MAX_SIDE = 3000;

function averageColor(bmp: ImageBitmap) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const g = canvas.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(bmp, 0, 0, 1, 1);
  const [r, gr, b] = g.getImageData(0, 0, 1, 1).data;
  return `rgb(${r},${gr},${b})`;
}

export async function loadPhoto(file: File): Promise<Photo> {
  let blob: Blob = file;

  if (/hei[cf]$/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
    // Only loaded when someone actually adds a HEIC photo
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    blob = Array.isArray(out) ? out[0] : out;
  }

  if (!/^image\/(jpeg|png|webp)$/.test(blob.type)) {
    throw new Error("Unsupported file. Use a JPG, PNG, WebP or HEIC photo.");
  }

  let bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const { width: ow, height: oh } = bmp;
  const longest = Math.max(ow, oh);

  if (longest > MAX_SIDE) {
    const k = MAX_SIDE / longest;
    bmp = await createImageBitmap(bmp, {
      resizeWidth: Math.round(ow * k),
      resizeHeight: Math.round(oh * k),
      resizeQuality: "high",
    });
  }

  return {
    id: crypto.randomUUID(),
    bmp,
    w: bmp.width,
    h: bmp.height,
    ow,
    oh,
    bg: averageColor(bmp),
    z: 1,
    x: 0,
    y: 0,
    rot: 0,
  };
}

const accentCache = new WeakMap<ImageBitmap, RGB>();

// The most saturated mid-tone pixel, used as the ticket's accent colour
export function dominantColor(bmp: ImageBitmap): RGB {
  const cached = accentCache.get(bmp);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 16;
  const g = canvas.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(bmp, 0, 0, 16, 16);
  const d = g.getImageData(0, 0, 16, 16).data;

  let best: RGB = [194, 68, 30];
  let bestScore = -1;
  for (let i = 0; i < d.length; i += 4) {
    const max = Math.max(d[i], d[i + 1], d[i + 2]);
    const score = (max - Math.min(d[i], d[i + 1], d[i + 2])) * (max > 60 && max < 235 ? 1 : 0.3);
    if (score > bestScore) {
      bestScore = score;
      best = [d[i], d[i + 1], d[i + 2]];
    }
  }

  accentCache.set(bmp, best);
  return best;
}

// Centres the crop on the busiest part of the photo
export function smartCrop(p: Photo): Pick<Photo, "x" | "y" | "z"> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 24;
  const g = canvas.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(p.bmp, 0, 0, 24, 24);
  const d = g.getImageData(0, 0, 24, 24).data;

  let sx = 0;
  let sy = 0;
  let total = 0;
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 23; x++) {
      const i = (y * 24 + x) * 4;
      const edge =
        Math.abs(d[i] - d[i + 4]) + Math.abs(d[i + 1] - d[i + 5]) + Math.abs(d[i + 2] - d[i + 6]);
      total += edge;
      sx += edge * x;
      sy += edge * y;
    }
  }

  if (!total) return { x: 0, y: 0, z: 1 };
  return {
    x: clamp(((sx / total - 11.5) / 11.5) * 1.4),
    y: clamp(((sy / total - 11.5) / 11.5) * 1.4),
    z: 1.25,
  };
}

const quarterTurns = (p: Photo) => ((p.rot % 4) + 4) % 4;
export const isSideways = (p: Photo) => quarterTurns(p) % 2 === 1;
// Width over height as shown, after rotation
export const shownAspect = (p: Photo) => (isSideways(p) ? p.h / p.w : p.w / p.h);

// How far the photo can be panned in x and y, in px, for a w x h frame
export function panRange(p: Photo, w: number, h: number): [number, number] {
  const sw = isSideways(p) ? p.h : p.w;
  const sh = isSideways(p) ? p.w : p.h;
  const s = Math.max(w / sw, h / sh) * p.z;
  return [(sw * s - w) / 2, (sh * s - h) / 2];
}

// Draws the photo to cover x, y, w, h (like object-fit: cover) with rounded corners
export function drawCover(
  c: CanvasRenderingContext2D,
  p: Photo | null,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  filter?: string,
) {
  c.save();
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.clip();

  if (!p) {
    c.fillStyle = "rgba(128,128,128,.28)";
    c.fillRect(x, y, w, h);
    c.fillStyle = "rgb(110,110,110)";
    c.font = '500 16px "DM Mono"';
    c.textAlign = "center";
    c.fillText("+ add photo", x + w / 2, y + h / 2 + 5);
    c.restore();
    return;
  }

  const sw = isSideways(p) ? p.h : p.w;
  const sh = isSideways(p) ? p.w : p.h;
  const s = Math.max(w / sw, h / sh) * p.z;
  const [mx, my] = panRange(p, w, h);

  if (p.z < 1) {
    c.fillStyle = p.bg;
    c.fillRect(x, y, w, h);
  }
  c.translate(x + w / 2 - mx * p.x, y + h / 2 - my * p.y);
  c.rotate((quarterTurns(p) * Math.PI) / 2);
  if ("filter" in c) c.filter = filter || "none";
  c.drawImage(p.bmp, (-p.w * s) / 2, (-p.h * s) / 2, p.w * s, p.h * s);
  c.restore();
}
