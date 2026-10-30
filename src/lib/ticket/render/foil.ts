import type { FoilId } from "../ids";

export type FoilLook = {
  style: FoilId;
  // 0 to 100
  strength: number;
  // Direction of the bands, in degrees
  angle: number;
  // Where the bands are along that direction, 0 to 1. The preview moves it as the ticket tilts.
  shift: number;
};

const holo = (saturation: number, lightness: number) =>
  Array.from({ length: 9 }, (_, i) => `hsl(${(i % 8) * 45}, ${saturation}%, ${lightness}%)`);

// What each foil is made of. On light paper the colours are multiplied in, so they are pale and
// the printing stays dark. On dark paper they are added on, so they are deep and the paper glows.
const STOPS: Record<Exclude<FoilId, "off">, { light: string[]; dark: string[] }> = {
  holo: { light: holo(85, 78), dark: holo(85, 30) },
  gold: {
    light: ["#f6d98a", "#ffe9ad", "#e0b24a", "#fff3c4", "#d9a93c", "#ffe9ad", "#f6d98a"],
    dark: ["#45340c", "#7d5f16", "#51400f", "#977524", "#45340c", "#7d5f16", "#45340c"],
  },
  silver: {
    light: ["#d9dde4", "#f7f9fc", "#b9c0cc", "#ffffff", "#c7ced9", "#f7f9fc", "#d9dde4"],
    dark: ["#2c3037", "#6c727d", "#383c44", "#868c97", "#2c3037", "#6c727d", "#2c3037"],
  },
};

// Small, fast, and the same every time, so the glints do not flicker when something is redrawn
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Lays foil over a finished ticket. Only the ticket itself is touched: the notches and the
// corners stay see-through. Printing stays readable because the colours are blended in rather
// than painted over it.
export function applyFoil(target: HTMLCanvasElement, foil: FoilLook, darkPaper: boolean) {
  if (foil.style === "off" || foil.strength <= 0) return;

  const { width: w, height: h } = target;
  const layer = document.createElement("canvas");
  layer.width = w;
  layer.height = h;
  const g = layer.getContext("2d")!;

  const rad = (foil.angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const len = Math.hypot(w, h);
  const offset = (foil.shift - 0.5) * len * 0.9;
  const cx = w / 2 + dx * offset;
  const cy = h / 2 + dy * offset;

  const stops = STOPS[foil.style][darkPaper ? "dark" : "light"];
  const gradient = g.createLinearGradient(
    cx - (dx * len) / 2,
    cy - (dy * len) / 2,
    cx + (dx * len) / 2,
    cy + (dy * len) / 2,
  );
  stops.forEach((colour, i) => gradient.addColorStop(i / (stops.length - 1), colour));
  g.fillStyle = gradient;
  g.fillRect(0, 0, w, h);

  // Keep the foil only where the ticket is
  g.globalCompositeOperation = "destination-in";
  g.drawImage(target, 0, 0);

  const c = target.getContext("2d")!;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = Math.min(1, foil.strength / 100);
  c.globalCompositeOperation = darkPaper ? "screen" : "multiply";
  c.drawImage(layer, 0, 0);

  // A few glints, which is what makes it look like foil and not just a tint
  const random = seeded(1337);
  const count = Math.min(420, Math.round((w * h) / 4500));
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-atop";
  for (let i = 0; i < count; i++) {
    const x = random() * w;
    const y = random() * h;
    const r = Math.max(0.7, w / 800) * (0.5 + random());
    c.fillStyle = `rgba(255,255,255,${(0.25 + random() * 0.45) * (foil.strength / 100 + 0.3)})`;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
