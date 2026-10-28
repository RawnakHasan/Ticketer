import qrcode from "qrcode-generator";

import { rgb } from "../color";
import { drawCover } from "../photo";
import type { TicketState } from "./types";

export const FB = (s: number) => `800 ${s}px "Bricolage Grotesque"`;
export const FM =
  (weight = 400) =>
  (s: number) =>
    `${weight} ${s}px "DM Mono"`;
export const FC = (s: number) => `600 ${s}px Caveat`;

// Fonts the canvas needs before it draws
export const TICKET_FONTS = [
  '800 40px "Bricolage Grotesque"',
  '500 16px "DM Mono"',
  "600 28px Caveat",
];

type Ctx = CanvasRenderingContext2D;

export type Fit = (
  text: string,
  font: (size: number) => string,
  maxWidth: number,
  maxHeight: number,
  maxSize: number,
  minSize: number,
  lineHeight: number,
  label: string,
) => { s: number; ls: string[] };

// Shrinks text until it fits the box, wrapping on spaces. Leaves the canvas font set to the result.
export function makeFit(c: Ctx, warnings: string[]): Fit {
  const wrap = (text: string, maxWidth: number) => {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (c.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  return (text, font, maxWidth, maxHeight, maxSize, minSize, lineHeight, label) => {
    for (let s = maxSize; s >= minSize; s--) {
      c.font = font(s);
      const ls = wrap(text, maxWidth);
      if (
        ls.length * s * lineHeight <= maxHeight &&
        ls.every((l) => c.measureText(l).width <= maxWidth)
      ) {
        return { s, ls };
      }
    }
    c.font = font(minSize);
    warnings.push(`${label} is very long and was trimmed to stay legible`);
    return {
      s: minSize,
      ls: wrap(text, maxWidth).slice(
        0,
        Math.max(1, Math.floor(maxHeight / (minSize * lineHeight))),
      ),
    };
  };
}

let noiseCanvas: HTMLCanvasElement | null = null;

// Static grain texture, made once
function getNoise() {
  if (noiseCanvas) return noiseCanvas;
  const n = document.createElement("canvas");
  n.width = n.height = 96;
  const g = n.getContext("2d")!;
  const data = g.createImageData(96, 96);
  let seed = 7;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = seed % 255;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  noiseCanvas = n;
  return n;
}

// A canvas sized for the scale, clipped to the ticket outline and filled with paper.
// Pair it with punch() once everything is drawn.
export function createTicketCanvas(
  S: TicketState,
  k: number,
  W: number,
  H: number,
  radius: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * k);
  canvas.height = Math.round(H * k);
  const c = canvas.getContext("2d")!;
  c.scale(canvas.width / W, canvas.height / H);
  c.save();
  c.beginPath();
  c.roundRect(0, 0, W, H, S.corn ? 0 : radius);
  c.clip();
  c.globalAlpha = S.st.alpha;
  c.fillStyle = rgb(S.st.paper);
  c.fillRect(0, 0, W, H);
  c.globalAlpha = 1;
  if (S.grain) {
    c.globalAlpha = 0.08;
    c.fillStyle = c.createPattern(getNoise(), "repeat")!;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  }
  return { canvas, c };
}

// Cuts half circles out of the edge (the tear notches) and, with notched corners on, the corners
export function punch(
  c: Ctx,
  S: TicketState,
  W: number,
  H: number,
  notches: [number, number][],
  radius = 20,
) {
  c.restore();
  c.globalCompositeOperation = "destination-out";
  c.beginPath();
  for (const [x, y] of notches) {
    c.moveTo(x + radius, y);
    c.arc(x, y, radius, 0, 7);
  }
  if (S.corn) {
    for (const [x, y] of [
      [0, 0],
      [W, 0],
      [0, H],
      [W, H],
    ]) {
      c.moveTo(x + 20, y);
      c.arc(x, y, 20, 0, 7);
    }
  }
  c.fill();
  c.globalCompositeOperation = "source-over";
}

export function barcode(
  c: Ctx,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  const bits = [1, 0, 1, 0];
  for (const ch of text) for (let i = 7; i >= 0; i--) bits.push((ch.charCodeAt(0) >> i) & 1);
  bits.push(0, 1, 0, 1);
  const unit = w / bits.length;
  c.fillStyle = color;
  bits.forEach((bit, i) => bit && c.fillRect(x + i * unit, y, unit + 0.3, h));
}

export function drawQr(
  c: Ctx,
  text: string,
  x: number,
  y: number,
  size: number,
  warnings: string[],
  pad = 8,
  radius = 10,
) {
  try {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const unit = size / n;
    c.fillStyle = "#F6F2E9";
    c.beginPath();
    c.roundRect(x - pad, y - pad, size + pad * 2, size + pad * 2, radius);
    c.fill();
    c.fillStyle = "#1B1A17";
    for (let r = 0; r < n; r++) {
      for (let j = 0; j < n; j++) {
        if (qr.isDark(r, j)) c.fillRect(x + j * unit, y + r * unit, unit + 0.5, unit + 0.5);
      }
    }
  } catch {
    warnings.push("QR link is too long to encode");
  }
}

// The main photo with the shape settings applied (width, corner radius, frame, text shade)
export function drawMainPhoto(
  c: Ctx,
  S: TicketState,
  x: number,
  y: number,
  w: number,
  h: number,
  shade: number,
) {
  const { mp } = S;
  const width = (w * mp.w) / 100;
  const left = x + (w - width) / 2;

  drawCover(c, S.main, left, y, width, h, mp.r, S.flt);

  c.save();
  c.beginPath();
  c.roundRect(left, y, width, h, mp.r);
  c.clip();
  const shadeH = Math.min(h * 0.5, 200);
  const g = c.createLinearGradient(0, y + h - shadeH, 0, y + h);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${(shade * mp.s) / 100})`);
  c.fillStyle = g;
  c.fillRect(left, y + h - shadeH, width, shadeH);
  c.restore();

  if (mp.b > 0) {
    c.save();
    c.lineWidth = mp.b;
    c.strokeStyle = rgb(S.st.ink);
    c.beginPath();
    c.roundRect(
      left + mp.b / 2,
      y + mp.b / 2,
      width - mp.b,
      h - mp.b,
      Math.max(0, mp.r - mp.b / 2),
    );
    c.stroke();
    c.restore();
  }
}
