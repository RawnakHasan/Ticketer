import { makeStock, mix, rgb, withInk } from "../color";
import { drawCover } from "../photo";
import type { Preset } from "../presets";
import { layoutGroup } from "./layout";
import { TEMPLATES } from "./templates";
import type { TicketState } from "./types";

export type DrawOptions = {
  // Leave the backdrop out so a "ticket only" export has a transparent background
  transparent?: boolean;
};

// Draws the whole poster (backdrop plus one to three tickets) onto the canvas.
// The canvas size sets the resolution. Returns warnings, like text that had to be trimmed.
export function drawPoster(
  canvas: HTMLCanvasElement,
  preset: Preset,
  S: TicketState,
  options: DrawOptions = {},
): string[] {
  const W = canvas.width;
  const H = canvas.height;
  const u = W / preset.w;
  const c = canvas.getContext("2d")!;
  const { acc } = S;
  c.clearRect(0, 0, W, H);

  if (!(options.transparent && preset.bare)) drawBackdrop(c, S, W, H);

  const [top, bottom, side] = preset.safe;
  const pad = (preset.bare ? 0 : 56) * u;
  const availW = W - 2 * pad - 2 * side * u;
  const availH = H - (top + bottom) * u - 2 * pad;
  const group = layoutGroup(S.tpl, S.layout, S.tilt, S.dy);
  const k = Math.min(availW / group.bounds.w, availH / group.bounds.h);
  const originY = top * u + (H - (top + bottom) * u) / 2;
  const warnings: string[] = [];

  for (const item of group.items) {
    const ticket: TicketState = {
      ...S,
      main: item.swap ? S.stub : S.main,
      stub: item.swap ? S.main : S.stub,
      st: item.stock ? withInk(makeStock(item.stock, acc), S.inkOverride) : S.st,
    };
    const { canvas: rendered, warnings: w } = TEMPLATES[S.tpl].render(ticket, k);

    c.save();
    if (!preset.bare) {
      c.shadowColor = `rgba(0,0,0,${(0.45 * S.shadow) / 100})`;
      c.shadowBlur = 40 * u;
      c.shadowOffsetY = 18 * u;
    }
    c.translate(W / 2 + (item.x - group.bounds.cx) * k, originY + (item.y - group.bounds.cy) * k);
    c.rotate(item.r);
    c.drawImage(rendered, -rendered.width / 2, -rendered.height / 2);
    c.restore();
    warnings.push(...w);
  }

  return [...new Set(warnings)];
}

function drawBackdrop(c: CanvasRenderingContext2D, S: TicketState, W: number, H: number) {
  const { acc } = S;

  if (S.backdrop === "plain") {
    c.fillStyle = rgb(mix(acc, [236, 232, 222], 0.84));
    c.fillRect(0, 0, W, H);
    return;
  }

  const g = c.createLinearGradient(0, 0, W * 0.5, H);
  g.addColorStop(0, rgb(mix(acc, [18, 16, 14], 0.6)));
  g.addColorStop(1, rgb(mix(acc, [255, 250, 240], 0.5)));
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  if (S.backdrop === "blur" && S.main && "filter" in c) {
    const photo = { ...S.main, z: 1.2, x: 0, y: 0, rot: 0 };
    drawCover(c, photo, -W * 0.05, -H * 0.05, W * 1.1, H * 1.1, 0, "blur(26px) brightness(.72)");
  }
}
