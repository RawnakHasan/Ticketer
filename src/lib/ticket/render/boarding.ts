import { drawCover } from "../photo";
import type { FieldKey } from "../fields";
import { barcode, drawMainPhoto, FB, FM, punch, stampAt, tearLine, ticketKit } from "./shared";
import type { Rendered, TicketState } from "./types";

// "Label: value" becomes a label and a value. Without a colon it is all value.
const splitCustom = (text: string): [string, string] => {
  const i = text.indexOf(":");
  return i < 0 ? ["", text] : [text.slice(0, i).trim().toUpperCase(), text.slice(i + 1).trim()];
};

// Two places in the header, a photo panel, custom fields, and a stub with a photo and barcode
export function renderBoarding(S: TicketState, k: number): Rendered {
  const W = 1000;
  const PX = 730;
  const { canvas, c, H, dy, f, show, warnings, on, fit, A, OA, I, M } = ticketKit(S, k, W, 440, 26);

  const place = (key: FieldKey, x: number, align: CanvasTextAlign) => {
    if (!on(key)) return;
    const [code, ...city] = f[key].split("·");
    c.textAlign = align;
    c.fillStyle = I;
    const r = fit(code.trim(), FB, 200, 64, 62, 34, 1, "Route");
    c.fillText(r.ls[0], x, 88);
    c.fillStyle = M;
    const r2 = fit(city.join("·").trim() || " ", FM(), 220, 20, 15, 11, 1, "City");
    c.fillText(r2.ls[0], x, 114);
  };
  place("from", 36, "left");
  place("to", 694, "right");

  // Dotted route with a plane-less arrow between the two places
  c.strokeStyle = M;
  c.lineWidth = 2;
  c.setLineDash([6, 6]);
  c.beginPath();
  c.moveTo(270, 70);
  c.lineTo(460, 70);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = I;
  for (const x of [258, 472]) {
    c.beginPath();
    c.arc(x, 70, 6, 0, 7);
    c.fill();
  }
  c.fillStyle = A;
  c.beginPath();
  c.moveTo(374, 54);
  c.lineTo(398, 70);
  c.lineTo(374, 86);
  c.lineTo(381, 70);
  c.fill();

  drawMainPhoto(c, S, 16, 132, 698, 190 + dy, 0.6);

  c.save();
  c.translate(0, dy);
  c.fillStyle = "#fff";
  c.textAlign = "left";
  if (on("title")) {
    const r = fit(f.title, FB, 450, 84, 44, 24, 1, "Title");
    const yb = on("sub") ? 276 : 302;
    r.ls.forEach((line, i) => c.fillText(line, 36, yb - (r.ls.length - 1 - i) * r.s));
  }
  if (on("sub")) {
    c.fillStyle = "rgba(255,255,255,.92)";
    const r = fit(f.sub, FM(), 450, 20, 15, 11, 1, "Subtitle");
    c.fillText(r.ls[0], 36, 304);
  }
  if (on("cap")) {
    c.fillStyle = "#fff";
    const r = fit(f.cap, (s) => `600 ${s}px Caveat`, 200, 34, 32, 18, 1, "Caption");
    c.textAlign = "right";
    c.fillText(r.ls[0], 694, 304);
  }
  if (show.stamp) {
    // This block is shifted down by dy, so a dragged position has to be shifted back up
    const at: [number, number] = S.sp ? [S.sp.x * W, S.sp.y * H - dy] : [620, 208];
    stampAt(c, { ...S, sp: null }, W, H, at, A, OA);
  }

  const cells = (
    [
      ["name", "PASSENGER"],
      ["date", "DATE"],
      ["time", "TIME"],
      ["place", "VENUE"],
      ["x1", ""],
      ["x2", ""],
      ["x3", ""],
    ] as const
  )
    .filter(([key]) => on(key))
    .map(([key, label]): [string, string, number] => {
      const [l, v] = key.startsWith("x") ? splitCustom(f[key]) : [label, f[key]];
      return [l, v, key === "place" ? 2 : 1];
    });
  const unit = Math.min(
    150,
    676 /
      Math.max(
        1,
        cells.reduce((sum, cell) => sum + cell[2], 0),
      ),
  );
  let cx = 36;
  for (const [label, value, span] of cells) {
    const x = cx;
    const cw = unit * span;
    cx += cw;
    c.textAlign = "left";
    c.fillStyle = M;
    c.font = FM()(10);
    c.fillText(label, x, 352);
    c.fillStyle = I;
    const r = fit(value, FM(500), cw - 10, 36, 16, 11, 1.1, label || "Field");
    r.ls.forEach((line, j) => c.fillText(line, x, 376 + j * r.s * 1.1));
  }
  if (on("fine")) {
    c.textAlign = "left";
    c.fillStyle = M;
    const r = fit(f.fine, FM(), 680, 12, 11, 10, 1, "Fine print");
    c.fillText(r.ls[0], 36, 428);
  }
  c.restore();

  // The stub: a photo, tier and price, barcode and handle
  const hp = Math.min(230, S.sa.mw + 40);
  const sx = PX + 16;
  const sw = W - PX - 32;
  drawCover(c, S.stub, sx, 16, sw, hp, S.sa.r, S.flt);
  c.textAlign = "left";
  if (on("tier")) {
    c.fillStyle = I;
    const r = fit(f.tier.toUpperCase(), FB, sw, 34, 28, 16, 1, "Tier");
    c.fillText(r.ls[0], sx, hp + 52);
  }
  if (on("price")) {
    c.fillStyle = M;
    const r = fit(f.price, FM(500), sw, 22, 18, 11, 1, "Price");
    c.fillText(r.ls[0], sx, hp + 78);
  }
  if (on("serial")) {
    barcode(c, f.serial, sx, H - 124, sw, 56, I);
    c.fillStyle = I;
    c.font = FM(500)(13);
    c.fillText(`NO. ${f.serial}`, sx, H - 46);
  }
  if (on("handle")) {
    c.fillStyle = M;
    const r = fit(f.handle, FM(500), sw, 16, 13, 10, 1, "Handle");
    c.fillText(r.ls[0], sx, H - 24);
  }

  tearLine(c, S, PX, 34, PX, H - 34);
  punch(c, S, W, H, [
    [PX, 0],
    [PX, H],
  ]);
  return { canvas, warnings };
}
