import {
  UNROUNDED,
  circle,
  customPolygon,
  normalizeRadial,
  regularPolygon,
  rectangle,
  rotated,
  rounding,
  scaled,
  star,
  type Cubic,
  type RoundedPolygon,
} from "@/lib/shapes/roundedPolygon";

// The 35 shapes of the M3 Expressive shape library, defined as in MaterialShapes.java
const R15 = rounding(0.15);
const R20 = rounding(0.2);
const R30 = rounding(0.3);
const R50 = rounding(0.5);
const R100 = rounding(1);

const builders = {
  circle: () => circle(10),
  square: () => rectangle(1, 1, R30),
  slantedSquare: () =>
    customPolygon(
      [
        [0.926, 0.97, rounding(0.189, 0.811)],
        [-0.021, 0.967, rounding(0.187, 0.057)],
      ],
      2,
      0.5,
      0.5,
      false,
    ),
  arch: () => rotated(regularPolygon(4, 1, 0, 0, UNROUNDED, [R100, R100, R20, R20]), -135),
  fan: () =>
    customPolygon(
      [
        [1, 1, rounding(0.148, 0.417)],
        [0, 1, rounding(0.151, 0)],
        [0, 0, rounding(0.148, 0)],
        [0.978, 0.02, rounding(0.803, 0)],
      ],
      1,
      0.5,
      0.5,
      false,
    ),
  arrow: () =>
    customPolygon(
      [
        [0.5, 0.892, rounding(0.313, 0)],
        [-0.216, 1.05, rounding(0.207, 0)],
        [0.499, -0.16, rounding(0.215, 1)],
        [1.225, 1.06, rounding(0.211, 0)],
      ],
      1,
      0.5,
      0.5,
      false,
    ),
  semiCircle: () => rectangle(1.6, 1, UNROUNDED, [R20, R20, R100, R100]),
  oval: () => rotated(scaled(circle(), 1, 0.64), -45),
  pill: () =>
    customPolygon(
      [
        [0.961, 0.039, rounding(0.426, 0)],
        [1.001, 0.428],
        [1, 0.609, R100],
      ],
      2,
      0.5,
      0.5,
      true,
    ),
  triangle: () => rotated(regularPolygon(3, 1, 0, 0, R20), -90),
  diamond: () =>
    customPolygon(
      [
        [0.5, 1.096, rounding(0.151, 0.524)],
        [0.04, 0.5, rounding(0.159, 0)],
      ],
      2,
      0.5,
      0.5,
      false,
    ),
  clamShell: () =>
    customPolygon(
      [
        [0.171, 0.841, rounding(0.159, 0)],
        [-0.02, 0.5, rounding(0.14, 0)],
        [0.17, 0.159, rounding(0.159, 0)],
      ],
      2,
      0.5,
      0.5,
      false,
    ),
  pentagon: () => customPolygon([[0.5, -0.009, rounding(0.172, 0)]], 5, 0.5, 0.5, false),
  gem: () =>
    rotated(
      customPolygon(
        [
          [0.499, 1.023, rounding(0.241, 0.778)],
          [-0.005, 0.792, rounding(0.208, 0)],
          [0.073, 0.258, rounding(0.228, 0)],
          [0.433, 0, rounding(0.491, 0)],
        ],
        1,
        0.5,
        0.5,
        true,
      ),
      -90,
    ),
  sunny: () => star(8, 1, 0.8, R15),
  verySunny: () =>
    customPolygon(
      [
        [0.5, 1.08, rounding(0.085, 0)],
        [0.358, 0.843, rounding(0.085, 0)],
      ],
      8,
      0.5,
      0.5,
      false,
    ),
  cookie4: () =>
    customPolygon(
      [
        [1.237, 1.236, rounding(0.258, 0)],
        [0.5, 0.918, rounding(0.233, 0)],
      ],
      4,
      0.5,
      0.5,
      false,
    ),
  cookie6: () =>
    customPolygon(
      [
        [0.723, 0.884, rounding(0.394, 0)],
        [0.5, 1.099, rounding(0.398, 0)],
      ],
      6,
      0.5,
      0.5,
      false,
    ),
  cookie7: () => rotated(star(7, 1, 0.75, R50), -90),
  cookie9: () => rotated(star(9, 1, 0.8, R50), -90),
  cookie12: () => rotated(star(12, 1, 0.8, R50), -90),
  ghostish: () =>
    customPolygon(
      [
        [0.5, 0, R100],
        [1, 0, R100],
        [1, 1.14, rounding(0.254, 0.106)],
        [0.575, 0.906, rounding(0.253, 0)],
      ],
      1,
      0.5,
      0.5,
      true,
    ),
  clover4: () =>
    customPolygon(
      [
        [0.5, 0.074],
        [0.725, -0.099, rounding(0.476, 0)],
      ],
      4,
      0.5,
      0.5,
      true,
    ),
  clover8: () =>
    customPolygon(
      [
        [0.5, 0.036],
        [0.758, -0.101, rounding(0.209, 0)],
      ],
      8,
      0.5,
      0.5,
      false,
    ),
  burst: () =>
    customPolygon(
      [
        [0.5, -0.006, rounding(0.006, 0)],
        [0.592, 0.158, rounding(0.006, 0)],
      ],
      12,
      0.5,
      0.5,
      false,
    ),
  softBurst: () =>
    customPolygon(
      [
        [0.193, 0.277, rounding(0.053, 0)],
        [0.176, 0.055, rounding(0.053, 0)],
      ],
      10,
      0.5,
      0.5,
      false,
    ),
  boom: () =>
    customPolygon(
      [
        [0.457, 0.296, rounding(0.007, 0)],
        [0.5, -0.051, rounding(0.007, 0)],
      ],
      15,
      0.5,
      0.5,
      false,
    ),
  softBoom: () =>
    customPolygon(
      [
        [0.733, 0.454],
        [0.839, 0.437, rounding(0.532, 0)],
        [0.949, 0.449, rounding(0.439, 1)],
        [0.998, 0.478, rounding(0.174, 0)],
      ],
      16,
      0.5,
      0.5,
      true,
    ),
  flower: () =>
    customPolygon(
      [
        [0.37, 0.187],
        [0.416, 0.049, rounding(0.381, 0)],
        [0.479, 0, rounding(0.095, 0)],
      ],
      8,
      0.5,
      0.5,
      true,
    ),
  puffy: () =>
    scaled(
      customPolygon(
        [
          [0.5, 0.053],
          [0.545, -0.04, rounding(0.405, 0)],
          [0.67, -0.035, rounding(0.426, 0)],
          [0.717, 0.066, rounding(0.574, 0)],
          [0.722, 0.128],
          [0.777, 0.002, rounding(0.36, 0)],
          [0.914, 0.149, rounding(0.66, 0)],
          [0.926, 0.289, rounding(0.66, 0)],
          [0.881, 0.346],
          [0.94, 0.344, rounding(0.126, 0)],
          [1.003, 0.437, rounding(0.255, 0)],
        ],
        2,
        0.5,
        0.5,
        true,
      ),
      1,
      0.742,
    ),
  puffyDiamond: () =>
    customPolygon(
      [
        [0.87, 0.13, rounding(0.146, 0)],
        [0.818, 0.357],
        [1, 0.332, rounding(0.853, 0)],
      ],
      4,
      0.5,
      0.5,
      true,
    ),
  pixelCircle: () =>
    customPolygon(
      [
        [0.5, 0],
        [0.704, 0],
        [0.704, 0.065],
        [0.843, 0.065],
        [0.843, 0.148],
        [0.926, 0.148],
        [0.926, 0.296],
        [1, 0.296],
      ],
      2,
      0.5,
      0.5,
      true,
    ),
  pixelTriangle: () =>
    customPolygon(
      [
        [0.11, 0.5],
        [0.113, 0],
        [0.287, 0],
        [0.287, 0.087],
        [0.421, 0.087],
        [0.421, 0.17],
        [0.56, 0.17],
        [0.56, 0.265],
        [0.674, 0.265],
        [0.675, 0.344],
        [0.789, 0.344],
        [0.789, 0.439],
        [0.888, 0.439],
      ],
      1,
      0.5,
      0.5,
      true,
    ),
  bun: () =>
    customPolygon(
      [
        [0.796, 0.5],
        [0.853, 0.518, R100],
        [0.992, 0.631, R100],
        [0.968, 1, R100],
      ],
      2,
      0.5,
      0.5,
      true,
    ),
  heart: () =>
    customPolygon(
      [
        [0.5, 0.268, rounding(0.016, 0)],
        [0.792, -0.066, rounding(0.958, 0)],
        [1.064, 0.276, R100],
        [0.501, 0.946, rounding(0.129, 0)],
      ],
      1,
      0.5,
      0.5,
      true,
    ),
} satisfies Record<string, () => RoundedPolygon>;

export type MaterialShapeName = keyof typeof builders;

export const materialShapeNames = Object.keys(builders) as MaterialShapeName[];

// The sequence the M3 loading indicator morphs through
export const LOADING_SEQUENCE: readonly MaterialShapeName[] = [
  "softBurst",
  "cookie9",
  "pentagon",
  "pill",
  "sunny",
  "cookie4",
  "oval",
];

const cubicCache = new Map<MaterialShapeName, Cubic[]>();

// Cubic Béziers of the shape, centered on (0, 0) and fitting in the unit circle
export function materialShapeCubics(name: MaterialShapeName): Cubic[] {
  let cubics = cubicCache.get(name);
  if (!cubics) {
    cubics = normalizeRadial(builders[name]());
    cubicCache.set(name, cubics);
  }
  return cubics;
}

// Corners with no rounding leave a cubic that is just a point, those aren't drawn
const isPoint = (c: Cubic) =>
  [2, 4, 6].every((i) => Math.abs(c[i] - c[0]) < 1e-9 && Math.abs(c[i + 1] - c[1]) < 1e-9);

// SVG path of the shape for a viewBox of "-1 -1 2 2"
export function materialShapePath(name: MaterialShapeName, digits = 4): string {
  const f = (v: number) => +v.toFixed(digits);
  const cubics = materialShapeCubics(name).filter((c) => !isPoint(c));
  const first = cubics[0];
  let d = `M${f(first[0])} ${f(first[1])}`;
  for (const c of cubics) {
    d += `C${f(c[2])} ${f(c[3])} ${f(c[4])} ${f(c[5])} ${f(c[6])} ${f(c[7])}`;
  }
  return `${d}Z`;
}

// ---- Morphing ----
// Shapes are compared by their radius at evenly spaced angles around the center, so any two
// shapes can be blended by blending those radii. Every shape in the loading sequence is
// star-shaped around its center, which is what makes this exact for them. For other shapes
// the outer outline is used.
export const RADII_SAMPLES = 288;

const radiiCache = new Map<string, Float32Array>();

export function materialShapeRadii(name: MaterialShapeName, samples = RADII_SAMPLES): Float32Array {
  const key = `${name}:${samples}`;
  const cached = radiiCache.get(key);
  if (cached) return cached;

  // Outline as short straight edges
  const edges: [number, number, number, number][] = [];
  for (const c of materialShapeCubics(name)) {
    if (isPoint(c)) continue;
    const steps = 16;
    let px = c[0];
    let py = c[1];
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const u = 1 - t;
      const x = u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6];
      const y = u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7];
      edges.push([px, py, x, y]);
      px = x;
      py = y;
    }
  }

  const radii = new Float32Array(samples).fill(-1);
  for (let k = 0; k < samples; k++) {
    const dx = Math.cos((2 * Math.PI * k) / samples);
    const dy = Math.sin((2 * Math.PI * k) / samples);
    let best = -1;
    for (const [ax, ay, bx, by] of edges) {
      const ex = bx - ax;
      const ey = by - ay;
      const crossDE = dx * ey - dy * ex;
      if (Math.abs(crossDE) < 1e-12) continue;
      const u = -(ax * dy - ay * dx) / (ex * dy - ey * dx);
      const t = (ax * ey - ay * ex) / crossDE;
      if (u >= 0 && u <= 1 && t > 0 && t > best) best = t;
    }
    radii[k] = best;
  }
  // A ray can slip between two edges at a vertex, fill those from the neighbors
  for (let k = 0; k < samples; k++) {
    if (radii[k] >= 0) continue;
    let a = k;
    let b = k;
    while (radii[a] < 0) a = (a + samples - 1) % samples;
    while (radii[b] < 0) b = (b + 1) % samples;
    radii[k] = (radii[a] + radii[b]) / 2;
  }

  radiiCache.set(key, radii);
  return radii;
}

const trig = new Map<number, { cos: Float32Array; sin: Float32Array }>();

// Smooth closed SVG path through the given radii (viewBox "-1 -1 2 2")
export function polarPath(radii: ArrayLike<number>): string {
  const n = radii.length;
  let table = trig.get(n);
  if (!table) {
    table = { cos: new Float32Array(n), sin: new Float32Array(n) };
    for (let k = 0; k < n; k++) {
      table.cos[k] = Math.cos((2 * Math.PI * k) / n);
      table.sin[k] = Math.sin((2 * Math.PI * k) / n);
    }
    trig.set(n, table);
  }
  const xs = new Float32Array(n);
  const ys = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    xs[k] = radii[k] * table.cos[k];
    ys[k] = radii[k] * table.sin[k];
  }
  // Quadratic curves through the midpoints, with the samples as control points
  const mx = (k: number) => ((xs[k] + xs[(k + 1) % n]) / 2).toFixed(3);
  const my = (k: number) => ((ys[k] + ys[(k + 1) % n]) / 2).toFixed(3);
  const parts = [`M${mx(n - 1)} ${my(n - 1)}`];
  for (let k = 0; k < n; k++) {
    parts.push(`Q${xs[k].toFixed(3)} ${ys[k].toFixed(3)} ${mx(k)} ${my(k)}`);
  }
  return `${parts.join("")}Z`;
}
