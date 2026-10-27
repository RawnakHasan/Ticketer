// Port of the geometry the Material shapes need from androidx.graphics.shapes:
// cubic Béziers, points and 2D transforms. Everything is in a y-down coordinate system.

export const DISTANCE_EPSILON = 1e-4;
export const ANGLE_EPSILON = 1e-6;

export type Point = { x: number; y: number };

// [a, b, c, d, e, f] maps (x, y) to (a*x + c*y + e, b*x + d*y + f)
export type Matrix = readonly [number, number, number, number, number, number];

export const scaleMatrix = (sx: number, sy: number): Matrix => [sx, 0, 0, sy, 0, 0];

export const rotationMatrix = (degrees: number): Matrix => {
  const r = (degrees * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, s, -s, c, 0, 0];
};

// Scales around (cx, cy), then moves (cx, cy) to (dx, dy)
export const fitMatrix = (
  scale: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): Matrix => [scale, 0, 0, scale, dx - scale * cx, dy - scale * cy];

export const transformPoint = (m: Matrix, x: number, y: number): Point => ({
  x: m[0] * x + m[2] * y + m[4],
  y: m[1] * x + m[3] * y + m[5],
});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const positiveModulo = (n: number, mod: number) => ((n % mod) + mod) % mod;

export const distance = (x: number, y: number) => Math.hypot(x, y);

export function direction(x: number, y: number): Point {
  const d = Math.hypot(x, y);
  if (d <= 0) throw new Error("Can't take the direction of a zero-length vector");
  return { x: x / d, y: y / d };
}

export const radialToCartesian = (radius: number, angle: number, cx = 0, cy = 0): Point => ({
  x: radius * Math.cos(angle) + cx,
  y: radius * Math.sin(angle) + cy,
});

export class Cubic {
  // anchor0, control0, control1, anchor1 as x, y pairs
  readonly p: readonly number[];

  constructor(points: readonly number[]) {
    if (points.length !== 8) throw new Error("A cubic needs 8 numbers");
    this.p = points;
  }

  static straightLine(x0: number, y0: number, x1: number, y1: number) {
    return new Cubic([
      x0,
      y0,
      lerp(x0, x1, 1 / 3),
      lerp(y0, y1, 1 / 3),
      lerp(x0, x1, 2 / 3),
      lerp(y0, y1, 2 / 3),
      x1,
      y1,
    ]);
  }

  // Cubic approximation of the arc of a circle centered at (cx, cy) that goes from p0 to p1
  static circularArc(cx: number, cy: number, x0: number, y0: number, x1: number, y1: number) {
    const p0d = direction(x0 - cx, y0 - cy);
    const p1d = direction(x1 - cx, y1 - cy);
    const r0 = { x: -p0d.y, y: p0d.x };
    const r1 = { x: -p1d.y, y: p1d.x };
    const clockwise = r0.x * (x1 - cx) + r0.y * (y1 - cy) >= 0;
    const cosa = p0d.x * p1d.x + p0d.y * p1d.y;
    // p0 and p1 are (almost) the same point
    if (cosa > 0.999) return Cubic.straightLine(x0, y0, x1, y1);
    const k =
      ((distance(x0 - cx, y0 - cy) *
        (4 / 3) *
        (Math.sqrt(2 * (1 - cosa)) - Math.sqrt(1 - cosa * cosa))) /
        (1 - cosa)) *
      (clockwise ? 1 : -1);
    return new Cubic([x0, y0, x0 + r0.x * k, y0 + r0.y * k, x1 - r1.x * k, y1 - r1.y * k, x1, y1]);
  }

  get anchor0X() {
    return this.p[0];
  }
  get anchor0Y() {
    return this.p[1];
  }
  get anchor1X() {
    return this.p[6];
  }
  get anchor1Y() {
    return this.p[7];
  }

  zeroLength() {
    return (
      Math.abs(this.p[0] - this.p[6]) < DISTANCE_EPSILON &&
      Math.abs(this.p[1] - this.p[7]) < DISTANCE_EPSILON
    );
  }

  pointOnCurve(t: number): Point {
    const u = 1 - t;
    const [a0x, a0y, c0x, c0y, c1x, c1y, a1x, a1y] = this.p;
    return {
      x: a0x * (u * u * u) + c0x * (3 * t * u * u) + c1x * (3 * t * t * u) + a1x * (t * t * t),
      y: a0y * (u * u * u) + c0y * (3 * t * u * u) + c1y * (3 * t * t * u) + a1y * (t * t * t),
    };
  }

  split(t: number): [Cubic, Cubic] {
    const u = 1 - t;
    const pt = this.pointOnCurve(t);
    const [a0x, a0y, c0x, c0y, c1x, c1y, a1x, a1y] = this.p;
    return [
      new Cubic([
        a0x,
        a0y,
        a0x * u + c0x * t,
        a0y * u + c0y * t,
        a0x * (u * u) + c0x * (2 * u * t) + c1x * (t * t),
        a0y * (u * u) + c0y * (2 * u * t) + c1y * (t * t),
        pt.x,
        pt.y,
      ]),
      new Cubic([
        pt.x,
        pt.y,
        c0x * (u * u) + c1x * (2 * u * t) + a1x * (t * t),
        c0y * (u * u) + c1y * (2 * u * t) + a1y * (t * t),
        c1x * u + a1x * t,
        c1y * u + a1y * t,
        a1x,
        a1y,
      ]),
    ];
  }

  reverse() {
    const [a0x, a0y, c0x, c0y, c1x, c1y, a1x, a1y] = this.p;
    return new Cubic([a1x, a1y, c1x, c1y, c0x, c0y, a0x, a0y]);
  }

  transformed(m: Matrix) {
    const out: number[] = [];
    for (let i = 0; i < 8; i += 2) {
      const pt = transformPoint(m, this.p[i], this.p[i + 1]);
      out.push(pt.x, pt.y);
    }
    return new Cubic(out);
  }

  interpolate(other: Cubic, t: number) {
    return new Cubic(this.p.map((v, i) => lerp(v, other.p[i], t)));
  }
}
