import { barcode, drawMainPhoto, FB, FC, FM, punch, stampAt, ticketKit } from "./shared";
import type { Rendered, TicketState } from "./types";

// Thermal receipt: photo, itemised rows, a total, a barcode and zigzag edges
export function renderReceipt(S: TicketState, k: number): Rendered {
  const W = 560;
  const { canvas, c, H, dy, f, show, warnings, on, fit, A, OA, I, M } = ticketKit(S, k, W, 980, 0);

  const dash = (y: number) => {
    c.save();
    c.strokeStyle = M;
    c.lineWidth = 1.5;
    c.setLineDash([6, 5]);
    c.beginPath();
    c.moveTo(40, y);
    c.lineTo(W - 40, y);
    c.stroke();
    c.restore();
  };

  c.textAlign = "center";
  let y = 40;
  if (on("title")) {
    c.fillStyle = I;
    const r = fit(f.title.toUpperCase(), FB, 460, 60, 40, 20, 1, "Title");
    r.ls.forEach((line, i) => c.fillText(line, W / 2, y + r.s * 0.86 + i * r.s));
    y += r.ls.length * r.s + 10;
  }
  if (on("sub")) {
    c.fillStyle = M;
    const r = fit(f.sub, FM(), 460, 20, 14, 10, 1, "Subtitle");
    c.fillText(r.ls[0], W / 2, y + 14);
  }

  dash(136);
  drawMainPhoto(c, S, 60, 156, 440, 300 + dy, 0);
  if (show.stamp) stampAt(c, S, W, H, [446, 204], A, OA);

  let ry = 498 + dy;
  dash(ry - 18);
  (
    [
      ["NAME", "name"],
      ["DATE", "date"],
      ["TIME", "time"],
      ["VENUE", "place"],
      ["TIER", "tier"],
    ] as const
  )
    .filter(([, key]) => on(key))
    .forEach(([label, key]) => {
      c.textAlign = "left";
      c.fillStyle = M;
      c.font = FM()(14);
      c.fillText(label, 40, ry);
      c.textAlign = "right";
      c.fillStyle = I;
      const r = fit(f[key], FM(500), 330, 20, 15, 10, 1, label);
      c.fillText(r.ls[0], W - 40, ry);
      ry += 30;
    });
  dash(ry - 10);

  if (on("price")) {
    c.textAlign = "left";
    c.fillStyle = I;
    c.font = FB(26);
    c.fillText("TOTAL", 40, ry + 28);
    c.textAlign = "right";
    const r = fit(f.price, FB, 300, 34, 30, 16, 1, "Price");
    c.fillText(r.ls[0], W - 40, ry + 28);
  }
  ry += 64;
  c.textAlign = "center";
  if (on("fine")) {
    c.fillStyle = M;
    const r = fit(f.fine, FM(), 480, 14, 11, 10, 1, "Fine print");
    c.fillText(r.ls[0], W / 2, ry);
    ry += 26;
  }
  if (on("serial")) {
    barcode(c, f.serial, (W - 300) / 2, ry, 300, 56, I);
    c.fillStyle = I;
    c.font = FM(500)(13);
    c.fillText(`NO. ${f.serial}`, W / 2, ry + 80);
    ry += 100;
  }
  if (on("cap")) {
    c.fillStyle = I;
    const r = fit(f.cap, FC, 480, 34, 32, 20, 1, "Caption");
    c.fillText(r.ls[0], W / 2, ry + 26);
  }

  punch(c, S, W, H, []);

  // Zigzag top and bottom edge
  c.globalCompositeOperation = "destination-out";
  c.beginPath();
  for (let x = 0; x < W; x += 20) {
    c.moveTo(x, 0);
    c.lineTo(x + 10, 12);
    c.lineTo(x + 20, 0);
    c.moveTo(x, H);
    c.lineTo(x + 10, H - 12);
    c.lineTo(x + 20, H);
  }
  c.fill();
  c.globalCompositeOperation = "source-over";
  return { canvas, warnings };
}
