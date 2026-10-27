// Path builders for the M3 Expressive progress indicators. Every shape is a stroke with round
// caps, so a bar or an arc is a centerline plus a stroke width. Linear bars run along x and sit
// on y = 0. Circular arcs are around the origin, with 0 degrees at the top, going clockwise.

import { Cubic } from "@/lib/shapes/geometry";

export type Stroke = { d: string; width: number };

export const NO_STROKE: Stroke = { d: "", width: 0 };

// Control handle of each half wave, as a fraction of the half wavelength (same as Android)
const WAVE_SMOOTHNESS = 0.48;

const f = (n: number) => +n.toFixed(2);

export function setStroke(el: SVGElement | null | undefined, stroke: Stroke) {
  if (!el) return;
  el.setAttribute("d", stroke.d);
  el.setAttribute("stroke-width", String(stroke.width));
}

// ---------------------------------------------------------------------------------------------
// Linear

// A straight bar from x0 to x1. Shorter than it is thick, it shrinks into a dot.
export function flatBar(x0: number, x1: number, thickness: number): Stroke {
  const length = x1 - x0;
  if (length <= 0) return NO_STROKE;
  const width = Math.min(thickness, length);
  const r = width / 2;
  return { d: `M${f(x0 + r)} 0H${f(x1 - r)}`, width };
}

// Finds the curve parameter where a cubic that only goes right reaches x
function solveX(cubic: Cubic, x: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (cubic.pointOnCurve(mid).x < x) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// A bar from x0 to x1 that follows a wave. The wave is anchored to the track, not to the bar,
// so the bar slides over it. `phase` is how many wavelengths the wave has moved.
export function wavyBar(
  x0: number,
  x1: number,
  thickness: number,
  amplitude: number,
  wavelength: number,
  phase: number,
): Stroke {
  const r = thickness / 2;
  // The round caps cover the first and last r of the bar
  const a = x0 + r;
  const b = x1 - r;
  if (b <= a || amplitude < 0.01) return flatBar(x0, x1, thickness);

  const half = wavelength / 2;
  const anchorX = (k: number) => half * (k - 2 * phase);
  // Even anchors are the low points (y grows downward), odd ones the high points
  const anchorY = (k: number) => (((k % 2) + 2) % 2 === 0 ? amplitude : -amplitude);

  let d = "";
  for (let k = Math.floor(a / half + 2 * phase); anchorX(k) < b; k++) {
    let seg = new Cubic([
      anchorX(k),
      anchorY(k),
      anchorX(k) + WAVE_SMOOTHNESS * half,
      anchorY(k),
      anchorX(k + 1) - WAVE_SMOOTHNESS * half,
      anchorY(k + 1),
      anchorX(k + 1),
      anchorY(k + 1),
    ]);
    if (anchorX(k) < a) seg = seg.split(solveX(seg, a))[1];
    if (anchorX(k + 1) > b) seg = seg.split(solveX(seg, b))[0];
    if (d === "") d = `M${f(seg.p[0])} ${f(seg.p[1])}`;
    d += `C${f(seg.p[2])} ${f(seg.p[3])} ${f(seg.p[4])} ${f(seg.p[5])} ${f(seg.p[6])} ${f(seg.p[7])}`;
  }
  return { d, width: thickness };
}

// ---------------------------------------------------------------------------------------------
// Circular

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

export const arcDegrees = toDegrees;

const pointAt = (radius: number, degrees: number) => ({
  x: radius * Math.sin(toRadians(degrees)),
  y: -radius * Math.cos(toRadians(degrees)),
});

// An arc of the circle with the given radius. Shorter than the round caps, it shrinks into a dot.
export function flatArc(
  radius: number,
  startDeg: number,
  sweepDeg: number,
  thickness: number,
): Stroke {
  if (sweepDeg <= 0) return NO_STROKE;
  // The angle that one round cap covers
  const capDeg = toDegrees(thickness / 2 / radius);
  if (sweepDeg < capDeg * 2) {
    const shrink = sweepDeg / (capDeg * 2);
    const p = pointAt(radius, startDeg + capDeg * shrink);
    return { d: `M${f(p.x)} ${f(p.y)}h0`, width: thickness * shrink };
  }
  const start = startDeg + capDeg;
  const sweep = sweepDeg - capDeg * 2;
  // An SVG arc can't be a full circle, and is ambiguous at 180 degrees: use pieces of 120
  const pieces = Math.max(1, Math.ceil(sweep / 120));
  const p0 = pointAt(radius, start);
  let d = `M${f(p0.x)} ${f(p0.y)}`;
  for (let i = 1; i <= pieces; i++) {
    const p = pointAt(radius, start + (sweep * i) / pieces);
    d += `A${f(radius)} ${f(radius)} 0 0 1 ${f(p.x)} ${f(p.y)}`;
  }
  return { d, width: thickness };
}

// Polar angle of a point, in degrees from the top, brought within 180 degrees of `near`
function angleOf(x: number, y: number, near: number) {
  const a = toDegrees(Math.atan2(x, -y));
  return near + ((((a - near) % 360) + 540) % 360) - 180;
}

// Finds the curve parameter where a cubic that only goes clockwise reaches an angle
function solveAngle(cubic: Cubic, degrees: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const p = cubic.pointOnCurve(mid);
    if (angleOf(p.x, p.y, degrees) < degrees) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// An arc that follows a wave around the circle. The wave dips toward the center, so the track's
// outer edge stays on the circle. `phase` is how many wavelengths the wave has moved.
export function wavyArc(
  radius: number,
  startDeg: number,
  sweepDeg: number,
  thickness: number,
  amplitude: number,
  wavelength: number,
  phase: number,
): Stroke {
  const capDeg = toDegrees(thickness / 2 / radius);
  if (sweepDeg < capDeg * 2 || amplitude < 0.01)
    return flatArc(radius, startDeg, sweepDeg, thickness);

  // Whole number of cycles per circle, at least 3
  const cycles = Math.max(3, Math.floor((2 * Math.PI * radius) / wavelength));
  const halfStep = 180 / cycles;
  const handle = ((Math.PI * radius) / cycles) * WAVE_SMOOTHNESS;
  const anchorDeg = (k: number) => halfStep * (k - 2 * phase);
  const anchorR = (k: number) => (((k % 2) + 2) % 2 === 0 ? radius : radius - 2 * amplitude);
  const anchor = (k: number) => pointAt(anchorR(k), anchorDeg(k));
  // Direction of travel at an anchor: the tangent of the circle
  const tangent = (k: number) => ({
    x: Math.cos(toRadians(anchorDeg(k))),
    y: Math.sin(toRadians(anchorDeg(k))),
  });

  const a = startDeg + capDeg;
  const b = startDeg + sweepDeg - capDeg;
  let d = "";
  for (let k = Math.floor(a / halfStep + 2 * phase); anchorDeg(k) < b; k++) {
    const p0 = anchor(k);
    const p1 = anchor(k + 1);
    const t0 = tangent(k);
    const t1 = tangent(k + 1);
    let seg = new Cubic([
      p0.x,
      p0.y,
      p0.x + t0.x * handle,
      p0.y + t0.y * handle,
      p1.x - t1.x * handle,
      p1.y - t1.y * handle,
      p1.x,
      p1.y,
    ]);
    if (anchorDeg(k) < a) seg = seg.split(solveAngle(seg, a))[1];
    if (anchorDeg(k + 1) > b) seg = seg.split(solveAngle(seg, b))[0];
    if (d === "") d = `M${f(seg.p[0])} ${f(seg.p[1])}`;
    d += `C${f(seg.p[2])} ${f(seg.p[3])} ${f(seg.p[4])} ${f(seg.p[5])} ${f(seg.p[6])} ${f(seg.p[7])}`;
  }
  return { d, width: thickness };
}
