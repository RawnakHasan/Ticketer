import {
  Hct,
  QuantizerCelebi,
  Score,
  argbFromRgb,
  blueFromArgb,
  greenFromArgb,
  redFromArgb,
} from "@material/material-color-utilities";

import { contrastRatio, luminance, type RGB } from "./color";
import { clamp } from "./math";
import type { Photo } from "./types";

export const FALLBACK_ACCENT: RGB = [194, 68, 30];

// Colours the ticket can use, worked out from the photos. Every pair that is read as text
// (ink and ink2 on paper) is checked for contrast, so none of these needs a manual fix.
export type PhotoPalette = {
  paper: RGB;
  ink: RGB;
  ink2: RGB;
  acc: RGB;
};

const toRgb = (argb: number): RGB => [redFromArgb(argb), greenFromArgb(argb), blueFromArgb(argb)];
const hctOf = (color: RGB) => Hct.fromInt(argbFromRgb(color[0], color[1], color[2]));
const colour = (hue: number, chroma: number, tone: number): RGB =>
  toRgb(Hct.from(hue, chroma, tone).toInt());

const seedCache = new WeakMap<ImageBitmap, RGB[]>();

// The few colours that best describe a photo, most useful first. Material's scorer prefers
// colourful, well-spread colours over big areas of grey, which is what a ticket wants.
export function photoSeeds(bmp: ImageBitmap): RGB[] {
  const cached = seedCache.get(bmp);
  if (cached) return cached;

  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(bmp, 0, 0, size, size);
  const data = g.getImageData(0, 0, size, size).data;

  const pixels: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] >= 128) pixels.push(argbFromRgb(data[i], data[i + 1], data[i + 2]));
  }

  let seeds: RGB[] = [];
  if (pixels.length) {
    const quantized = QuantizerCelebi.quantize(pixels, 48);
    // A black and white photo has no colourful pixels. Its most common colour stands in.
    let common = 0;
    let commonCount = -1;
    for (const [argb, count] of quantized) {
      if (count > commonCount) {
        common = argb;
        commonCount = count;
      }
    }
    seeds = Score.score(quantized, { desired: 5, fallbackColorARGB: common }).map(toRgb);
  }

  if (!seeds.length) seeds = [FALLBACK_ACCENT];
  seedCache.set(bmp, seeds);
  return seeds;
}

// Moves the colour lighter or darker, away from the background, until it reads at `min`:1
export function ensureContrast(fg: RGB, bg: RGB, min: number): RGB {
  if (contrastRatio(fg, bg) >= min) return fg;

  const { hue, chroma, tone } = hctOf(fg);
  const step = luminance(bg) > 0.4 ? -2 : 2;
  for (let t = tone + step; t >= 0 && t <= 100; t += step) {
    const next = colour(hue, chroma, t);
    if (contrastRatio(next, bg) >= min) return next;
  }
  return contrastRatio([0, 0, 0], bg) > contrastRatio([255, 255, 255], bg)
    ? [0, 0, 0]
    : [255, 255, 255];
}

// The accent keeps the photo's own colour, with its lightness held in a range where chips
// and stamps stay readable on paper (or on dark paper)
function accentOf(seed: RGB, dark: boolean): RGB {
  const { hue, chroma, tone } = hctOf(seed);
  const t = dark ? clamp(tone, 60, 80) : clamp(tone, 36, 58);
  // A grey photo gets a grey accent. Anything with colour gets a lively one.
  return colour(hue, chroma < 12 ? chroma : clamp(chroma, 36, 110), t);
}

const hueGap = (a: number, b: number) => {
  const gap = Math.abs(a - b) % 360;
  return Math.min(gap, 360 - gap);
};

// Small, fast, seedable. The same shuffle number always gives the same colours.
function seeded(seed: number) {
  let a = Math.imul(seed, 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Soft paper and deep text in the main photo's colour, accent straight from it, and a second
// text colour from the stub photo (or the main photo's next colour when there is no stub)
function calm(main: RGB[], stub: RGB[]): PhotoPalette {
  const base = hctOf(main[0]);
  const second = hctOf(stub[0] ?? main[1] ?? main[0]);
  const soft = (k: number, lo: number, hi: number) =>
    base.chroma < 5 ? base.chroma : clamp(base.chroma * k, lo, hi);

  const paper = colour(base.hue, soft(0.22, 5, 14), 95);
  return {
    paper,
    ink: colour(base.hue, soft(0.3, 6, 20), 10),
    ink2: ensureContrast(colour(second.hue, clamp(second.chroma, 30, 70), 36), paper, 5),
    acc: accentOf(main[0], false),
  };
}

// A different, still tasteful combination each time: paper from one photo colour, accent and
// second text from others (or a turned hue when the photos only have one colour to offer)
function shuffled(main: RGB[], stub: RGB[], shuffle: number): PhotoPalette {
  const random = seeded(shuffle);
  const pool = [...main, ...stub].map(hctOf);
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];

  const roll = random();
  const mode = roll < 0.45 ? "light" : roll < 0.75 ? "dark" : "vivid";
  const base = pick(pool);
  const turn = pick([30, 150, 180, 210]);

  const others = pool.filter((h) => hueGap(h.hue, base.hue) > 35);
  const accentSeed = others.length
    ? pick(others)
    : Hct.from((base.hue + turn) % 360, Math.max(base.chroma, 56), 50);
  const inkSeed = others.length > 1 ? pick(others) : accentSeed;

  const soft = (k: number, lo: number, hi: number) =>
    base.chroma < 5 ? base.chroma : clamp(base.chroma * k, lo, hi);
  const lift = random() * 3;

  let paper: RGB;
  let ink: RGB;
  let ink2: RGB;
  if (mode === "light") {
    paper = colour(base.hue, soft(0.22, 5, 16), 94 + lift);
    ink = colour(base.hue, soft(0.3, 6, 20), 10);
    ink2 = colour(inkSeed.hue, clamp(inkSeed.chroma, 35, 80), 38);
  } else if (mode === "dark") {
    paper = colour(base.hue, soft(0.3, 6, 22), 10 + lift);
    ink = colour(base.hue, soft(0.15, 4, 12), 94);
    ink2 = colour(inkSeed.hue, clamp(inkSeed.chroma, 25, 60), 80);
  } else {
    paper = colour(base.hue, clamp(base.chroma, 28, 60), 84 + lift);
    ink = colour(base.hue, 24, 12);
    ink2 = colour(inkSeed.hue, 50, 28);
  }

  const acc = ensureContrast(accentOf(toRgb(accentSeed.toInt()), mode === "dark"), paper, 1.8);
  return {
    paper,
    ink: ensureContrast(ink, paper, 7),
    ink2: ensureContrast(ink2, paper, 5),
    acc,
  };
}

// `shuffle` 0 is the calm automatic combination, anything above is one more roll of the dice
export function buildPalette(
  main: Photo | null,
  stub: Photo | null,
  shuffle: number,
): PhotoPalette {
  const mainSeeds = main ? photoSeeds(main.bmp) : [FALLBACK_ACCENT];
  const stubSeeds = stub ? photoSeeds(stub.bmp) : [];
  return shuffle > 0 ? shuffled(mainSeeds, stubSeeds, shuffle) : calm(mainSeeds, stubSeeds);
}
