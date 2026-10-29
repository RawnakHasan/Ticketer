import { chipAt, drawMainPhoto, FB, FM, punch, scallop, ticketKit } from "./shared";
import type { Rendered, TicketState } from "./types";

// Postage stamp: scalloped edge, framed photo, a big denomination and a wavy postmark
export function renderStamp(S: TicketState, k: number): Rendered {
  const W = 600;
  const { canvas, c, H, dy, f, show, st, warnings, on, fit, A, OA, I, M } = ticketKit(
    S,
    k,
    W,
    760,
    0,
  );
  const by = 574 + dy;

  drawMainPhoto(c, S, 54, 54, 492, 520 + dy, 0.5);
  c.strokeStyle = `rgba(${st.ink.join(",")},.4)`;
  c.lineWidth = 1.5;
  c.strokeRect(45, 45, 510, 538 + dy);
  if (on("tier")) chipAt(c, fit, f.tier, 72, 72, A, OA);

  if (show.stamp) {
    // The postmark: two rings, wavy cancellation lines and the date
    c.save();
    const [x, y] = S.sp ? [S.sp.x * W, S.sp.y * H] : [440, 150];
    c.translate(x, y);
    c.scale(S.ssc, S.ssc);
    c.rotate(-0.2);
    c.strokeStyle = "rgba(255,255,255,.92)";
    c.fillStyle = "rgba(255,255,255,.95)";
    c.lineWidth = 3;
    c.beginPath();
    c.arc(0, 0, 50, 0, 7);
    c.stroke();
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(0, 0, 42, 0, 7);
    c.stroke();
    c.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) {
      const wy = -18 + i * 12;
      c.beginPath();
      c.moveTo(-190, wy);
      for (let wx = -190; wx < -56; wx += 22) {
        c.quadraticCurveTo(wx + 5.5, wy - 6, wx + 11, wy);
        c.quadraticCurveTo(wx + 16.5, wy + 6, wx + 22, wy);
      }
      c.stroke();
    }
    c.textAlign = "center";
    c.font = FM(500)(12);
    c.fillText((f.date || "").toUpperCase().slice(0, 12), 0, 4);
    c.restore();
  }

  c.textAlign = "left";
  if (on("title")) {
    c.fillStyle = I;
    const r = fit(f.title, FB, 320, 64, 40, 20, 1, "Title");
    r.ls.forEach((line, i) => c.fillText(line, 54, by + 44 + i * r.s));
  }
  if (on("price")) {
    c.fillStyle = I;
    c.textAlign = "right";
    const r = fit(f.price, FB, 190, 70, 64, 24, 1, "Price");
    c.fillText(r.ls[0], 546, by + 62);
    c.textAlign = "left";
  }
  if (on("sub")) {
    c.fillStyle = M;
    const r = fit(f.sub, FM(), 492, 20, 15, 10, 1, "Subtitle");
    c.fillText(r.ls[0], 54, H - 82);
  }
  const details = (["date", "place"] as const)
    .filter(on)
    .map((q) => f[q])
    .join("  ·  ");
  if (details) {
    c.fillStyle = I;
    const r = fit(details, FM(500), 492, 20, 15, 10, 1, "Details");
    c.fillText(r.ls[0], 54, H - 56);
  }

  punch(c, S, W, H, []);
  scallop(c, W, H);
  return { canvas, warnings };
}
