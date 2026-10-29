import { drawCover } from "../photo";
import { chipAt, drawMainPhoto, FB, FC, FM, punch, stampAt, tearLine, ticketKit } from "./shared";
import type { Rendered, TicketState } from "./types";

const formatTime = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;

// Wide photo with a handwritten caption, and a music-player panel on the right
export function renderPlayer(S: TicketState, k: number): Rendered {
  const W = 1000;
  const DX = 698;
  const { canvas, c, H, f, show, st, warnings, on, fit, A, OA, I, M } = ticketKit(S, k, W, 560, 26);

  drawMainPhoto(c, S, 16, 16, DX - 32, H - 32, 0.6);
  c.fillStyle = "#fff";
  c.textAlign = "left";
  if (on("cap")) {
    const r = fit(f.cap, FC, 420, 100, 56, 26, 1, "Caption");
    r.ls.forEach((line, i) => c.fillText(line, 44, H - 48 - (r.ls.length - 1) * r.s + i * r.s));
  }
  if (on("handle")) {
    const r = fit(f.handle, FM(500), 200, 18, 15, 11, 1, "Handle");
    c.textAlign = "right";
    c.fillText(r.ls[0], DX - 40, H - 48);
  }
  const info = (["tier", "date", "time", "place"] as const)
    .filter(on)
    .map((q) => f[q])
    .join("  ·  ");
  if (info) chipAt(c, fit, info, 32, 32, A, OA);
  if (show.stamp) stampAt(c, S, W, H, [DX - 100, 112], A, OA);

  const px = 722;
  const pw = 246;
  const size = Math.min(210, S.sa.mw + 60);
  drawCover(c, S.stub, px, 32, pw, size, S.sa.r, S.flt);
  c.textAlign = "left";

  if (on("lines")) {
    c.fillStyle = I;
    f.lines
      .split("|")
      .slice(0, 3)
      .forEach((line, i) => {
        const r = fit(line.trim() || " ", FC, pw, 34, 32, 18, 1, "Handwritten line");
        c.fillText(r.ls[0] ?? "", px, 32 + size + 40 + i * 38);
      });
  }
  if (on("title")) {
    c.fillStyle = I;
    const r = fit(f.title, FB, pw, 26, 24, 15, 1, "Title");
    c.fillText(r.ls[0], px, H - 150);
  }
  if (on("sub")) {
    c.fillStyle = M;
    const r = fit(f.sub, FM(), pw, 18, 14, 10, 1, "Subtitle");
    c.fillText(r.ls[0], px, H - 128);
  }

  // Progress bar and time labels
  const pg = S.prog / 100;
  c.fillStyle = `rgba(${st.ink.join(",")},.18)`;
  c.beginPath();
  c.roundRect(px, H - 105, pw, 6, 3);
  c.fill();
  c.fillStyle = A;
  c.beginPath();
  c.roundRect(px, H - 105, Math.max(6, pw * pg), 6, 3);
  c.fill();
  c.beginPath();
  c.arc(px + pw * pg, H - 102, 9, 0, 7);
  c.fill();
  if (on("dur")) {
    const [m, s] = f.dur.split(":");
    const total = (Number(m) || 0) * 60 + (Number(s) || 0);
    const elapsed = Math.round(total * pg);
    c.fillStyle = M;
    c.font = FM()(12);
    c.textAlign = "left";
    c.fillText(formatTime(elapsed), px, H - 78);
    c.textAlign = "right";
    c.fillText(`-${formatTime(total - elapsed)}`, px + pw, H - 78);
  }

  // Previous, play and next
  const cy = H - 44;
  c.fillStyle = A;
  c.beginPath();
  c.arc(845, cy, 24, 0, 7);
  c.fill();
  c.fillStyle = OA;
  c.beginPath();
  c.moveTo(838, cy - 11);
  c.lineTo(856, cy);
  c.lineTo(838, cy + 11);
  c.fill();
  c.fillStyle = I;
  c.beginPath();
  c.moveTo(790, cy - 10);
  c.lineTo(772, cy);
  c.lineTo(790, cy + 10);
  c.fill();
  c.fillRect(766, cy - 10, 3, 20);
  c.beginPath();
  c.moveTo(900, cy - 10);
  c.lineTo(918, cy);
  c.lineTo(900, cy + 10);
  c.fill();
  c.fillRect(921, cy - 10, 3, 20);

  tearLine(c, S, DX, 34, DX, H - 34);
  punch(c, S, W, H, [
    [DX, 0],
    [DX, H],
  ]);
  return { canvas, warnings };
}
