import { drawCover } from "../photo";
import {
  barcode,
  chipAt,
  drawMainPhoto,
  FB,
  FM,
  punch,
  stampAt,
  tearLine,
  ticketKit,
} from "./shared";
import type { Rendered, TicketState } from "./types";

// Full-bleed photo with the title over it, and a tear-off stub on the right
export function renderConcert(S: TicketState, k: number): Rendered {
  const W = 1000;
  const SX = 700;
  const { canvas, c, H, dy, f, show, warnings, on, fit, A, OA, I, M } = ticketKit(S, k, W, 440, 26);
  const { mp } = S;

  drawMainPhoto(c, S, 16, 16, 668, 408 + dy, 0.6);

  // Extra shade under the title, over the width the photo actually covers
  const shadeW = (668 * mp.w) / 100;
  const shadeX = 16 + (668 - shadeW) / 2;
  const g = c.createLinearGradient(0, H - 270, 0, H - 16);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,.7)");
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(shadeX, H - 270, shadeW, 254, [0, 0, mp.r, mp.r]);
  c.fill();

  c.fillStyle = "#fff";
  c.textAlign = "left";
  if (on("title")) {
    const r = fit(f.title, FB, 600, 150, 76, 30, 1, "Title");
    r.ls.forEach((line, i) =>
      c.fillText(line, 44, H - (on("sub") ? 82 : 50) - (r.ls.length - 1 - i) * r.s),
    );
  }
  if (on("sub")) {
    const r = fit(f.sub, FM(), 600, 22, 17, 11, 1.1, "Subtitle");
    c.fillText(r.ls[0], 44, H - 48);
  }
  const info = (["tier", "place"] as const)
    .filter(on)
    .map((q) => f[q])
    .join("  ·  ");
  if (info) chipAt(c, fit, info, 36, 36, A, OA);
  if (show.stamp) stampAt(c, S, W, H, [610, 112], A, OA);

  const sx = 732;
  const sw = 236;
  drawCover(c, S.stub, sx, 36, sw, 170, S.sa.r, S.flt);
  c.textAlign = "left";
  if (on("date")) {
    c.fillStyle = I;
    const r = fit(f.date, FB, sw, 40, 34, 16, 1, "Date");
    c.fillText(r.ls[0], sx, 246);
  }
  c.fillStyle = M;
  if (on("time")) {
    const r = fit(f.time, FM(500), sw, 22, 18, 11, 1, "Time");
    c.fillText(r.ls[0], sx, 272);
  }
  if (on("name")) {
    const r = fit(f.name, FM(), sw, 18, 15, 10, 1, "Name");
    c.fillText(r.ls[0], sx, 294);
  }
  if (on("price")) chipAt(c, fit, f.price, sx, 308, A, OA);
  if (on("serial")) {
    barcode(c, f.serial, sx, H - 72, sw, 34, I);
    c.fillStyle = M;
    c.font = FM()(12);
    c.fillText(f.serial, sx, H - 22);
  }

  tearLine(c, S, SX, 34, SX, H - 34);
  punch(c, S, W, H, [
    [SX, 0],
    [SX, H],
  ]);
  return { canvas, warnings };
}
