import { drawCover } from "../photo";
import { rgb } from "../color";
import { chipAt, drawMainPhoto, FC, FM, punch, stampAt, ticketKit } from "./shared";
import type { Rendered, TicketState } from "./types";

// Instant-photo style: a taped photo, a handwritten caption and a round stub photo
export function renderPolaroid(S: TicketState, k: number): Rendered {
  const W = 600;
  const { canvas, c, H, dy, f, show, st, warnings, on, fit, A, OA, I, M } = ticketKit(
    S,
    k,
    W,
    760,
    22,
  );
  const by = 506 + dy;

  drawMainPhoto(c, S, 36, 36, 528, 470 + dy, 0);

  // Tape
  c.save();
  c.translate(W / 2, 34);
  c.rotate(-0.05);
  c.fillStyle = A;
  c.globalAlpha = 0.55;
  c.fillRect(-60, -16, 120, 32);
  c.restore();

  if (on("tier")) chipAt(c, fit, f.tier, 54, 54, A, OA);
  if (show.stamp) stampAt(c, S, W, H, [496, 104], A, OA);

  c.textAlign = "center";
  if (on("cap")) {
    c.fillStyle = I;
    const r = fit(f.cap, FC, 470, 104, 54, 26, 1, "Caption");
    r.ls.forEach((line, i) => c.fillText(line, W / 2, by + 60 + i * r.s));
  }
  c.textAlign = "left";

  const headline = [on("title") && f.title, on("date") && f.date].filter(Boolean).join("  ·  ");
  if (headline) {
    c.fillStyle = I;
    const r = fit(headline, FM(500), 400, 22, 17, 11, 1, "Title");
    c.fillText(r.ls[0], 44, H - 98);
  }
  if (on("place")) {
    c.fillStyle = M;
    const r = fit(f.place, FM(), 400, 20, 14, 10, 1, "Place");
    c.fillText(r.ls[0], 44, H - 72);
  }
  const small = (["name", "serial"] as const)
    .filter(on)
    .map((q) => f[q])
    .join("  ·  ");
  if (small) {
    c.fillStyle = M;
    const r = fit(small, FM(), 400, 18, 13, 9, 1, "Details");
    c.fillText(r.ls[0], 44, H - 46);
  }

  // Round stub photo with a paper-coloured ring
  const cx = W - 36 - 42;
  const cy = H - 36 - 42;
  drawCover(c, S.stub, cx - 42, cy - 42, 84, 84, 42, S.flt);
  c.save();
  c.lineWidth = 6;
  c.strokeStyle = rgb(st.paper);
  c.beginPath();
  c.arc(cx, cy, 42, 0, 7);
  c.stroke();
  c.restore();

  punch(c, S, W, H, []);
  return { canvas, warnings };
}
