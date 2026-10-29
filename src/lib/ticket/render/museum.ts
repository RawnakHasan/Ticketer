import { drawCover } from "../photo";
import { drawMainPhoto, drawQr, FB, FC, FM, punch, qrText, tearLine, ticketKit } from "./shared";
import type { Rendered, TicketState } from "./types";

// Wide pass: stub photo and rotated text on the left, big photo with the title on the right
export function renderMuseum(S: TicketState, k: number): Rendered {
  const W = 1000;
  const MW = S.sa.mw;
  const PX = MW + 132;
  const { canvas, c, dy, H, f, show, warnings, on, fit, A, OA, I, M } = ticketKit(S, k, W, 420, 26);

  drawMainPhoto(c, S, PX + 16, 16, W - PX - 32, 388 + dy, 0.6);
  drawCover(c, S.stub, 16, 16, MW, 388 + dy, S.sa.r, S.flt);

  c.save();
  c.translate(0, dy);
  c.textAlign = "right";
  c.fillStyle = "#fff";
  const yb = on("sub") ? 350 : 382;
  if (on("title")) {
    const r = fit(f.title, FB, 440, 110, 56, 26, 1, "Title");
    r.ls.forEach((line, i) => c.fillText(line, 968, yb - (r.ls.length - 1 - i) * r.s));
  }
  if (on("sub")) {
    const r = fit(f.sub, FM(), 440, 20, 16, 11, 1.1, "Subtitle");
    c.fillText(r.ls[0], 968, 382);
  }
  c.textAlign = "left";
  if (on("cap")) {
    const r = fit(f.cap, FC, 400, 34, 32, 19, 1, "Caption");
    c.fillText(r.ls[0], PX + 36, 382);
  }
  if (on("handle")) {
    const r = fit(f.handle, FM(500), 300, 18, 15, 11, 1, "Handle");
    c.fillText(r.ls[0], PX + 36, on("cap") ? 346 : 382);
  }
  c.restore();

  const info = (["date", "time", "place", "name"] as const)
    .filter(on)
    .map((q) => f[q])
    .join("  ·  ");
  if (info) {
    const r = fit(info, FM(500), 400, 20, 14, 11, 1, "Details");
    const w = c.measureText(r.ls[0]).width + 28;
    c.fillStyle = A;
    c.beginPath();
    c.roundRect(PX + 32, 32, w, 32, 16);
    c.fill();
    c.fillStyle = OA;
    c.textAlign = "left";
    c.fillText(r.ls[0], PX + 46, 53);
  }

  if (show.stamp) {
    c.save();
    const [sx, sy] = S.sp ? [S.sp.x * W, S.sp.y * H] : [PX + 120, 176];
    c.translate(sx, sy);
    c.scale(S.ssc, S.ssc);
    c.rotate(-0.24);
    c.fillStyle = A;
    c.beginPath();
    c.arc(0, 0, 50, 0, 7);
    c.fill();
    c.fillStyle = OA;
    c.textAlign = "center";
    c.font = FB(19);
    c.fillText("ADMIT", 0, -2);
    c.fillText("ONE", 0, 19);
    c.restore();
  }

  if (show.qr) drawQr(c, qrText(S), 878, 32, 82, warnings);

  // Text turned a quarter, reading upwards along the stub
  const rotated = (
    x: number,
    text: string | false,
    label: string,
    max: number,
    min: number,
    font: (s: number) => string,
  ) => {
    if (!text) return;
    c.save();
    c.translate(x, 404 + dy);
    c.rotate(-Math.PI / 2);
    c.textAlign = "left";
    const r = fit(text, font, 388, max * 1.05, max, min, 1, label);
    c.fillText(r.ls[0], 0, 0);
    c.restore();
  };
  c.fillStyle = I;
  rotated(
    MW + 54,
    [on("tier") && S.f.tier.toUpperCase(), on("price") && S.f.price].filter(Boolean).join("  ·  "),
    "Tier",
    22,
    12,
    FM(600),
  );
  c.fillStyle = M;
  rotated(MW + 80, on("fine") && f.fine, "Fine print", 11, 10, FM());
  c.fillStyle = I;
  rotated(MW + 112, on("serial") && `N° ${f.serial}`, "Serial", 20, 12, FM(500));

  tearLine(c, S, PX, 34, PX, H - 34);
  punch(c, S, W, H, [
    [PX, 0],
    [PX, H],
  ]);
  return { canvas, warnings };
}
