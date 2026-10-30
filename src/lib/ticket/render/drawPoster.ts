import { drawStickers, onSide } from "../sticker";
import type { Preset } from "../presets";
import { backdropClock, drawAnimatedBackdrop, drawStaticBackdrop } from "./backdrop";
import { renderBack } from "./back";
import { layoutGroup } from "./layout";
import { TEMPLATES } from "./templates";
import type { TicketState } from "./types";

export type DrawOptions = {
  // Leave the backdrop out so a "ticket only" export has a transparent background
  transparent?: boolean;
  // Draw only the tickets. The preview animates the backdrop on a canvas of its own behind them.
  noBackdrop?: boolean;
  // Phase of the animated backdrop in seconds. Defaults to where the preview is now.
  time?: number;
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

  if (!(options.transparent && preset.bare) && !options.noBackdrop) {
    if (S.backdrop === "flow" || S.backdrop === "aurora") {
      drawAnimatedBackdrop(c, W, H, acc, S.backdrop, options.time ?? backdropClock.t);
    } else {
      drawStaticBackdrop(c, S.backdrop, acc, S.main, W, H);
    }
  }

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
      st: item.stock ? S.mkStock(item.stock) : S.st,
    };
    const render = S.back ? renderBack : TEMPLATES[S.tpl].render;
    const { canvas: rendered, warnings: w } = render(ticket, k);
    // Stickers go over everything the template drew, on the side each one is set to
    const side = S.back ? "back" : "front";
    drawStickers(
      rendered,
      S.stickers.filter((s) => onSide(s, side)),
      S.selectedSticker,
      S.stickerGuides,
    );

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
