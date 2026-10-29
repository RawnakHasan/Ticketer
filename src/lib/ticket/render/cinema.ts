import { drawCover } from "../photo";
import { drawMainPhoto, FB, FM, punch, stampAt, tearLine, ticketKit } from "./shared";
import type { Rendered, TicketState } from "./types";

// Poster on the left, big title and details in the middle, tear-off stub on the right
export function renderCinema(S: TicketState, k: number): Rendered {
  const W = 1000;
  const SX = 868;
  const { canvas, c, H, dy, f, show, st, warnings, on, fit, A, OA, I, M } = ticketKit(
    S,
    k,
    W,
    380,
    26,
  );

  drawMainPhoto(c, S, 16, 16, 300, 348 + dy, 0);
  if (show.stamp) stampAt(c, S, W, H, [266, 92], A, OA);

  const tx = 348;
  const tw = SX - tx - 28;
  c.textAlign = "left";
  let y = 58;
  if (on("tier")) {
    c.fillStyle = A;
    const r = fit(f.tier.toUpperCase(), FM(500), tw, 20, 15, 11, 1, "Tier");
    c.fillText(r.ls[0], tx, y);
    y += 18;
  }
  if (on("title")) {
    c.fillStyle = I;
    const r = fit(f.title, FB, tw, 118, 64, 28, 1, "Title");
    r.ls.forEach((line, i) => c.fillText(line, tx, y + r.s * (0.85 + i)));
    y += r.s * r.ls.length + 8;
  }
  if (on("sub")) {
    c.fillStyle = M;
    const r = fit(f.sub, FM(), tw, 20, 17, 11, 1, "Subtitle");
    c.fillText(r.ls[0], tx, y + 16);
  }

  c.fillStyle = `rgba(${st.ink.join(",")},.22)`;
  c.fillRect(tx, H - 132, tw, 2);
  (
    [
      ["DATE", "date"],
      ["TIME", "time"],
      ["PRICE", "price"],
    ] as const
  )
    .filter(([, key]) => on(key))
    .forEach(([label, key], i) => {
      const x = tx + (i * tw) / 3;
      c.fillStyle = M;
      c.font = FM(500)(11);
      c.fillText(label, x, H - 106);
      c.fillStyle = I;
      const r = fit(f[key], FB, tw / 3 - 14, 30, 26, 14, 1, label);
      c.fillText(r.ls[0], x, H - 76);
    });
  const where = (["name", "place"] as const)
    .filter(on)
    .map((q) => f[q])
    .join("  ·  ");
  if (where) {
    c.fillStyle = M;
    const r = fit(where, FM(), tw, 20, 16, 10, 1, "Details");
    c.fillText(r.ls[0], tx, H - 36);
  }

  drawCover(c, S.stub, SX + 22, 34, 88, 88, S.sa.r, S.flt);
  if (on("serial")) {
    c.save();
    c.translate(SX + 70, H - 26);
    c.rotate(-Math.PI / 2);
    c.fillStyle = M;
    c.textAlign = "left";
    c.font = FM(500)(13);
    c.fillText(f.serial, 0, 0);
    c.restore();
  }

  tearLine(c, S, SX, 34, SX, H - 34);
  punch(c, S, W, H, [
    [SX, 0],
    [SX, H],
  ]);
  return { canvas, warnings };
}
