import {
  drawMainPhoto,
  barcode,
  chipAt,
  FB,
  FC,
  FM,
  punch,
  scallop,
  stampAt,
  tearLine,
  ticketKit,
} from "./shared";
import type { Rendered, TicketState } from "./types";

const MONTHS = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split(" ");

// Reads "14 NOV 2026" (or anything Date understands) as [year, month, day]. Today if it can't.
function parseDate(text: string): [number, number, number] {
  const m = /([0-9]{1,2})[^0-9]+([A-Za-z]{3})[A-Za-z]*[^0-9]+([0-9]{4})/.exec(text || "");
  const month = m ? MONTHS.indexOf(m[2].toUpperCase()) : -1;
  if (m && month >= 0) return [Number(m[3]), month, Number(m[1])];

  const parsed = new Date(text || "");
  const now = new Date();
  return Number.isNaN(parsed.getTime())
    ? [now.getFullYear(), now.getMonth(), now.getDate()]
    : [parsed.getFullYear(), parsed.getMonth(), parsed.getDate()];
}

// Month grid built from the Date field, beside a photo with a holographic sheen
export function renderCalendar(S: TicketState, k: number): Rendered {
  const W = 1000;
  const { canvas, c, H, dy, f, show, warnings, on, fit, A, OA, I, M } = ticketKit(S, k, W, 600, 0);
  const [year, month, day] = parseDate(f.date);
  const first = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const { mp } = S;
  const ww = (540 * mp.w) / 100;
  const xx = 444 + (540 - ww) / 2;

  drawMainPhoto(c, S, 444, 16, 540, 568 + dy, 0.55);

  // Holographic tint over the photo
  c.save();
  c.beginPath();
  c.roundRect(xx, 16, ww, 568 + dy, mp.r);
  c.clip();
  c.globalCompositeOperation = "soft-light";
  c.globalAlpha = 0.6;
  const g = c.createLinearGradient(xx, 16, xx + ww, 584 + dy);
  g.addColorStop(0, "#ff7ad9");
  g.addColorStop(0.5, "#7af0ff");
  g.addColorStop(1, "#ffe27a");
  c.fillStyle = g;
  c.fillRect(xx, 16, ww, 568 + dy);
  c.restore();

  c.textAlign = "left";
  let ty = 44;
  if (on("title")) {
    c.fillStyle = I;
    const r = fit(f.title, FB, 340, 64, 40, 22, 1, "Title");
    r.ls.forEach((line, i) => c.fillText(line, 48, ty + r.s * 0.86 + i * r.s));
    ty += r.ls.length * r.s + 6;
  }
  if (on("sub")) {
    c.fillStyle = M;
    const r = fit(f.sub, FM(), 340, 20, 15, 10, 1, "Subtitle");
    c.fillText(r.ls[0], 48, ty + 14);
  }

  // The month grid, Monday first, with the ticket's day circled
  c.textAlign = "center";
  c.font = FM(500)(12);
  c.fillStyle = M;
  [..."MTWTFSS"].forEach((letter, i) => c.fillText(letter, 68 + i * 44, 168));
  c.font = FM(500)(17);
  for (let n = 1; n <= daysInMonth; n++) {
    const p = first + n - 1;
    const cx = 68 + (p % 7) * 44;
    const cy = 204 + Math.floor(p / 7) * 38;
    if (n === day) {
      c.fillStyle = A;
      c.beginPath();
      c.arc(cx, cy - 6, 18, 0, 7);
      c.fill();
      c.fillStyle = OA;
    } else {
      c.fillStyle = I;
    }
    c.fillText(String(n), cx, cy);
  }

  // Month and year, turned a quarter
  c.save();
  c.translate(402, 428);
  c.rotate(-Math.PI / 2);
  c.textAlign = "left";
  c.fillStyle = I;
  const label = `${new Date(year, month, 1).toLocaleString("en", { month: "long" }).toUpperCase()} ${year}`;
  const mr = fit(label, FB, 400, 30, 28, 14, 1, "Month");
  c.fillText(mr.ls[0], 0, 0);
  c.restore();

  c.textAlign = "left";
  if (on("date")) {
    c.fillStyle = I;
    const r = fit(f.date, FB, 330, 34, 30, 16, 1, "Date");
    c.fillText(r.ls[0], 48, H - 132);
  }
  const details = (["time", "place"] as const)
    .filter(on)
    .map((q) => f[q])
    .join("  ·  ");
  if (details) {
    c.fillStyle = M;
    const r = fit(details, FM(), 330, 20, 15, 10, 1, "Details");
    c.fillText(r.ls[0], 48, H - 104);
  }
  if (on("serial")) {
    barcode(c, f.serial, 48, H - 78, 200, 30, I);
    c.fillStyle = M;
    c.font = FM()(12);
    c.fillText(`NO. ${f.serial}`, 48, H - 32);
  }
  if (on("tier")) chipAt(c, fit, f.tier, xx + 20, 36, A, OA);
  if (show.stamp) stampAt(c, S, W, H, [xx + ww - 80, 110], A, OA);

  c.fillStyle = "#fff";
  c.textAlign = "left";
  if (on("cap")) {
    const r = fit(f.cap, FC, ww - 60, 60, 44, 22, 1, "Caption");
    c.fillText(r.ls[0], xx + 28, H - 50);
  }
  if (on("handle")) {
    const r = fit(f.handle, FM(500), ww - 60, 18, 14, 10, 1, "Handle");
    c.fillText(r.ls[0], xx + 28, H - 28);
  }

  tearLine(c, S, 432, 34, 432, H - 34);
  punch(c, S, W, H, [
    [432, 0],
    [432, H],
  ]);
  scallop(c, W, H);
  return { canvas, warnings };
}
