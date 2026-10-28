import type { StockId } from "./ids";

export type RGB = [number, number, number];

// Everything a template needs to colour a ticket
export type Stock = {
  paper: RGB;
  acc: RGB;
  alpha: number;
  ink: RGB;
  onacc: RGB;
};

const FIXED_PAPER: Partial<Record<StockId, RGB>> = {
  light: [244, 239, 230],
  dark: [23, 22, 26],
  vellum: [238, 241, 236],
  kraft: [218, 196, 158],
  navy: [20, 30, 56],
  sage: [214, 226, 208],
  rose: [240, 214, 210],
};

export const rgb = (color: RGB) => `rgb(${color.join(",")})`;
export const rgba = (color: RGB, alpha: number) => `rgba(${color.join(",")},${alpha})`;

export function luminance([r, g, b]: RGB) {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
}

export function contrastRatio(a: RGB, b: RGB) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function makeStock(id: StockId, acc: RGB): Stock {
  const paper =
    id === "tint" ? mix(acc, [255, 255, 255], 0.82) : (FIXED_PAPER[id] ?? FIXED_PAPER.light!);

  return {
    paper,
    acc,
    alpha: id === "vellum" ? 0.86 : 1,
    ink: luminance(paper) > 0.4 ? [27, 26, 23] : [242, 237, 227],
    onacc: luminance(acc) > 0.18 ? [27, 26, 23] : [255, 255, 255],
  };
}

export const withInk = (stock: Stock, ink: RGB | null): Stock => (ink ? { ...stock, ink } : stock);

export function rgbToHex(color: RGB) {
  return `#${color.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function hexToRgb(hex: string): RGB {
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as RGB;
}
