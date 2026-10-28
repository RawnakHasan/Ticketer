import type { LayoutId, TemplateId } from "../ids";
import { TEMPLATES } from "./templates";

export type Placement = {
  x: number;
  y: number;
  r: number;
  // Lead with the stub photo instead of the main one
  swap: boolean;
  // Paper stock override, for the variations layout
  stock?: "light" | "dark" | "tint";
};

// Where each ticket sits in a group, in design units. One ticket, two angled, or three variations.
export function layoutGroup(tpl: TemplateId, layout: LayoutId, tilt: number, dy = 0) {
  const [tw, baseH] = TEMPLATES[tpl].size;
  const th = baseH + dy;
  const tall = baseH > tw;

  const defs: Record<LayoutId, Omit<Placement, "r">[]> = {
    single: [{ x: 0, y: 0, swap: false }],
    twin: tall
      ? [
          { x: -340, y: -50, swap: false },
          { x: 340, y: 50, swap: true },
        ]
      : [
          { x: -40, y: -th / 2 - 40, swap: false },
          { x: 40, y: th / 2 + 40, swap: true },
        ],
    var: tall
      ? [
          { x: -660, y: 0, swap: false, stock: "light" },
          { x: 0, y: 0, swap: false, stock: "dark" },
          { x: 660, y: 0, swap: false, stock: "tint" },
        ]
      : [
          { x: 0, y: -th - 50, swap: false, stock: "light" },
          { x: 0, y: 0, swap: false, stock: "dark" },
          { x: 0, y: th + 50, swap: false, stock: "tint" },
        ],
  };

  const rotation = (layout === "twin" ? (tall ? 0.12 : -0.5) : 0) + (tilt * Math.PI) / 180;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const items: Placement[] = defs[layout].map((d) => ({
    ...d,
    x: d.x * cos - d.y * sin,
    y: d.x * sin + d.y * cos,
    r: rotation,
  }));

  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const item of items) {
    for (const [sx, sy] of [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const px = (sx * tw) / 2;
      const py = (sy * th) / 2;
      const X = item.x + px * cos - py * sin;
      const Y = item.y + px * sin + py * cos;
      x0 = Math.min(x0, X);
      x1 = Math.max(x1, X);
      y0 = Math.min(y0, Y);
      y1 = Math.max(y1, Y);
    }
  }

  return {
    items,
    bounds: { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 },
  };
}
