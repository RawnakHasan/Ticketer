import { barcode, drawQr, FB, FC, FM, punch, qrText, ticketKit } from "./shared";
import { TEMPLATES } from "./templates";
import type { Rendered, TicketState } from "./types";

// The back of any ticket: a title bar, the QR code, caption, fine print and a barcode
export function renderBack(S: TicketState, k: number): Rendered {
  const [W, baseH] = TEMPLATES[S.tpl].size;
  const { canvas, c, H, f, show, warnings, on, fit, A, OA, I, M } = ticketKit(S, k, W, baseH, 26);

  const wide = W > H;
  const qs = Math.round(Math.min(W, H) * (wide ? 0.46 : 0.36));
  const qx = wide ? 64 : (W - qs) / 2;
  const qy = wide ? 104 : 110;
  const tx = wide ? qx + qs + 64 : W / 2;
  const tw = wide ? W - tx - 56 : W - 120;

  c.fillStyle = A;
  c.fillRect(0, 0, W, 66);
  c.fillStyle = OA;
  c.textAlign = "center";
  if (on("title")) {
    const heading = [f.title, on("date") && f.date].filter(Boolean).join("  ·  ");
    const r = fit(heading, FB, W - 80, 36, 26, 14, 1, "Title");
    c.fillText(r.ls[0], W / 2, 44);
  }

  if (show.qr) drawQr(c, qrText(S), qx, qy, qs, warnings, 12, 14);

  c.textAlign = wide ? "left" : "center";
  let y = wide ? 124 : qy + qs + 78;
  if (on("cap")) {
    c.fillStyle = I;
    const r = fit(f.cap, FC, tw, 60, 44, 22, 1, "Caption");
    r.ls.forEach((line, i) => c.fillText(line, tx, y + i * r.s));
    y += r.ls.length * r.s + 18;
  }
  if (on("fine")) {
    c.fillStyle = M;
    const r = fit(f.fine, FM(), tw, 76, 15, 10, 1.35, "Fine print");
    r.ls.forEach((line, i) => c.fillText(line, tx, y + i * r.s * 1.35));
  }
  if (on("serial")) {
    const bw = Math.min(300, tw);
    const bx = wide ? tx : (W - bw) / 2;
    barcode(c, f.serial, bx, H - 110, bw, 46, I);
    c.fillStyle = I;
    c.font = FM(500)(13);
    c.textAlign = "left";
    c.fillText(`NO. ${f.serial}`, bx, H - 34);
  }
  if (on("handle")) {
    c.fillStyle = M;
    c.textAlign = "right";
    c.font = FM(500)(14);
    c.fillText(f.handle, W - 40, H - 34);
  }

  punch(c, S, W, H, []);
  return { canvas, warnings };
}
