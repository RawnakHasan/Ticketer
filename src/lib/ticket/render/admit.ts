import { mutedInk, rgb, rgba } from "../color";
import { drawCover } from "../photo";
import {
  barcode,
  createTicketCanvas,
  drawMainPhoto,
  drawQr,
  FB,
  FC,
  FM,
  makeFit,
  punch,
} from "./shared";
import type { Fit } from "./shared";
import type { Rendered, TicketState } from "./types";

const W = 600;
const BASE_H = 1000;
const NOTCH_Y = 708;
const NOTCH_R = 22;

// The classic tall ticket: photo, title, details grid, tear line and a stub with a barcode.
export function renderAdmit(S: TicketState, k: number): Rendered {
  const { dy, f, show, st } = S;
  const H = BASE_H + dy;
  const warnings: string[] = [];
  const { canvas, c } = createTicketCanvas(S, k, W, H, 28);
  const fit = makeFit(c, warnings);

  const on = (key: string) => Boolean(show[key] && f[key as keyof typeof f]?.trim());
  const ink = rgb(st.ink);
  const muted = mutedInk(st);
  const accent = rgb(st.acc);
  const onAccent = rgb(st.onacc);

  drawMainPhoto(c, S, 16, 16, 568, 372 + dy, 0.3);
  c.textAlign = "left";

  if (on("tier")) {
    const r = fit(f.tier.toUpperCase(), FM(500), 300, 20, 13, 10, 1, "Tier label");
    const w = c.measureText(r.ls[0]).width + 28;
    c.fillStyle = accent;
    c.beginPath();
    c.roundRect(32, 32, w, 30, 15);
    c.fill();
    c.fillStyle = onAccent;
    c.fillText(r.ls[0], 46, 52);
  }

  if (show.stamp) {
    c.save();
    const [sx, sy] = S.sp ? [S.sp.x * W, S.sp.y * H] : [496, 322 + dy];
    c.translate(sx, sy);
    c.scale(S.ssc, S.ssc);
    c.rotate(-0.24);
    c.fillStyle = accent;
    c.beginPath();
    c.arc(0, 0, 50, 0, 7);
    c.fill();
    c.strokeStyle = onAccent;
    c.lineWidth = 2;
    c.setLineDash([3, 4]);
    c.beginPath();
    c.arc(0, 0, 42, 0, 7);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = onAccent;
    c.textAlign = "center";
    c.font = FB(19);
    c.fillText("ADMIT", 0, -2);
    c.fillText("ONE", 0, 19);
    c.restore();
  }

  // Everything below the photo moves down with the photo's extra height
  c.save();
  c.translate(0, dy);
  c.textAlign = "left";
  let y = 414;

  if (on("title")) {
    c.fillStyle = ink;
    const r = fit(f.title, FB, 528, 100, 60, 28, 1.02, "Title");
    r.ls.forEach((line, i) => c.fillText(line, 36, y + r.s * 0.86 + i * r.s * 1.02));
    y += r.ls.length * r.s * 1.02 + 10;
  }
  if (on("sub")) {
    c.fillStyle = muted;
    const r = fit(f.sub, FM(), 528, 36, 17, 11, 1.25, "Subtitle");
    r.ls.forEach((line, i) => c.fillText(line, 36, y + r.s + i * r.s * 1.25));
  }

  const details = [
    ["name", "ADMIT ONE"],
    ["date", "DATE"],
    ["time", "TIME"],
    ["price", "PRICE"],
    ["place", "VENUE"],
  ].filter(([key]) => on(key));

  details.forEach(([key, label], i) => {
    const x = 36 + (i % 2) * 194;
    const yy = 578 + (i >> 1) * 42;
    const width = key === "place" && i % 2 === 0 ? 372 : 180;
    c.fillStyle = muted;
    c.font = FM()(10);
    c.fillText(label, x, yy);
    c.fillStyle = ink;
    const r = fit(
      f[key as keyof typeof f],
      FM(500),
      width,
      22,
      16,
      12,
      1.1,
      label[0] + label.slice(1).toLowerCase(),
    );
    c.fillText(r.ls[0], x, yy + 19);
  });

  if (show.qr) drawQr(c, f.url.trim() || `ticketer:${f.serial}`, 450, 574, 108, warnings);

  c.strokeStyle = rgba(st.ink, 0.42);
  c.lineWidth = 2;
  c.setLineDash([7, 7]);
  c.beginPath();
  c.moveTo(NOTCH_R + 14, NOTCH_Y);
  c.lineTo(W - NOTCH_R - 14, NOTCH_Y);
  c.stroke();
  c.setLineDash([]);

  drawStub(c, S, fit, on, ink, muted);
  c.restore();

  punch(
    c,
    S,
    W,
    H,
    [
      [0, NOTCH_Y + dy],
      [W, NOTCH_Y + dy],
    ],
    NOTCH_R,
  );
  return { canvas, warnings };
}

// Below the tear line: a photo strip, square or full stub, then barcode, handle, fine print, caption
function drawStub(
  c: CanvasRenderingContext2D,
  S: TicketState,
  fit: Fit,
  on: (key: string) => boolean,
  ink: string,
  muted: string,
) {
  const { f, sa } = S;
  let I = ink;
  let M = muted;
  let ix = 36;
  let bw = 300;

  if (sa.layout === "cover") {
    drawCover(c, S.stub, 16, 722, 568, 262, sa.r + 6, S.flt);
    const g = c.createLinearGradient(0, 722, 0, 984);
    g.addColorStop(0, "rgba(0,0,0,.6)");
    g.addColorStop(0.5, "rgba(0,0,0,.1)");
    g.addColorStop(1, "rgba(0,0,0,.75)");
    c.fillStyle = g;
    c.beginPath();
    c.roundRect(16, 722, 568, 262, sa.r + 6);
    c.fill();
    I = "#fff";
    M = "rgba(255,255,255,.88)";
  }

  const square = sa.layout === "square";
  if (square) {
    drawCover(c, S.stub, 36, 744, sa.sq, sa.sq, sa.r, S.flt);
    ix = 58 + sa.sq;
    bw = Math.min(300, 564 - ix);
  }

  const by = square || sa.layout === "cover" ? 744 : 736;

  if (on("serial")) {
    barcode(c, f.serial, ix, by, bw, 58, I);
    c.fillStyle = I;
    c.font = FM(500)(14);
    c.fillText(`NO. ${f.serial}`, ix, by + 84);
  }
  if (on("handle")) {
    c.fillStyle = I;
    const r = fit(f.handle, FM(500), square ? 564 - ix : 210, 22, 17, 12, 1.1, "Handle");
    c.textAlign = square ? "left" : "right";
    c.fillText(r.ls[0], square ? ix : 564, square ? by + 112 : 762);
    c.textAlign = "left";
  }
  if (sa.layout === "band") drawCover(c, S.stub, 16, 924 - sa.h, 568, sa.h, sa.r, S.flt);
  if (on("fine")) {
    c.fillStyle = M;
    const r = fit(f.fine, FM(), 528, 14, 11, 10, 1.1, "Fine print");
    c.fillText(r.ls[0], 36, 947);
  }
  if (on("cap")) {
    c.fillStyle = I;
    c.save();
    c.translate(36, 982);
    c.rotate(-0.02);
    const r = fit(f.cap, FC, 520, 30, 30, 19, 1, "Caption");
    c.fillText(r.ls[0], 0, 0);
    c.restore();
  }
}
