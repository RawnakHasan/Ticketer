// Rounded polygons, following the corner math of androidx.graphics.shapes (the library behind
// Material's shapes on Android). A shape is a closed list of cubic Béziers.

export type Point = { x: number; y: number };

// radius is in the shape's own units, smoothing (0..1) extends the corner with a gentler curve
export type CornerRounding = { readonly radius: number; readonly smoothing: number };

// x0 y0, x1 y1, x2 y2, x3 y3
export type Cubic = [number, number, number, number, number, number, number, number];

export type RoundedPolygon = { cubics: Cubic[]; centerX: number; centerY: number };

// A template vertex for customPolygon: x, y and an optional rounding
export type Vertex = [x: number, y: number, rounding?: CornerRounding];

export const UNROUNDED: CornerRounding = { radius: 0, smoothing: 0 };
export const rounding = (radius: number, smoothing = 0): CornerRounding => ({ radius, smoothing });

const EPSILON = 1e-4;

const direction = (x: number, y: number): Point => {
  const d = Math.hypot(x, y);
  return d > 0 ? { x: x / d, y: y / d } : { x: 0, y: 0 };
};
const rotate90 = (p: Point): Point => ({ x: -p.y, y: p.x });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;

function straightLine(x0: number, y0: number, x1: number, y1: number): Cubic {
  return [
    x0,
    y0,
    x0 + (x1 - x0) / 3,
    y0 + (y1 - y0) / 3,
    x0 + ((x1 - x0) * 2) / 3,
    y0 + ((y1 - y0) * 2) / 3,
    x1,
    y1,
  ];
}

function circularArc(center: Point, p0: Point, p1: Point): Cubic {
  const p0d = direction(p0.x - center.x, p0.y - center.y);
  const p1d = direction(p1.x - center.x, p1.y - center.y);
  const rotatedP0 = rotate90(p0d);
  const rotatedP1 = rotate90(p1d);
  const clockwise = dot(rotatedP0, { x: p1.x - center.x, y: p1.y - center.y }) >= 0;
  const cosa = dot(p0d, p1d);
  if (cosa > 0.999) return straightLine(p0.x, p0.y, p1.x, p1.y);
  const k =
    ((Math.hypot(p0.x - center.x, p0.y - center.y) * 4) / 3) *
    ((Math.sqrt(2 * (1 - cosa)) - Math.sqrt(1 - cosa * cosa)) / (1 - cosa)) *
    (clockwise ? 1 : -1);
  return [
    p0.x,
    p0.y,
    p0.x + rotatedP0.x * k,
    p0.y + rotatedP0.y * k,
    p1.x - rotatedP1.x * k,
    p1.y - rotatedP1.y * k,
    p1.x,
    p1.y,
  ];
}

function lineIntersection(p0: Point, d0: Point, p1: Point, d1: Point): Point | null {
  const rotatedD1 = rotate90(d1);
  const den = dot(d0, rotatedD1);
  if (Math.abs(den) < EPSILON) return null;
  const num = dot({ x: p1.x - p0.x, y: p1.y - p0.y }, rotatedD1);
  if (Math.abs(den) < EPSILON * Math.abs(num)) return null;
  const k = num / den;
  return { x: p0.x + d0.x * k, y: p0.y + d0.y * k };
}

// The curve that leads from the straight side into the circular arc of a corner
function flankingCurve(
  actualRoundCut: number,
  actualSmoothing: number,
  corner: Point,
  sideStart: Point,
  circleSegmentIntersection: Point,
  otherCircleSegmentIntersection: Point,
  circleCenter: Point,
  actualR: number,
): Cubic {
  const sideDirection = direction(sideStart.x - corner.x, sideStart.y - corner.y);
  const curveStart: Point = {
    x: corner.x + sideDirection.x * actualRoundCut * (1 + actualSmoothing),
    y: corner.y + sideDirection.y * actualRoundCut * (1 + actualSmoothing),
  };
  // Approximation of where the arc starts, good enough and cheap
  const mid: Point = {
    x: (circleSegmentIntersection.x + otherCircleSegmentIntersection.x) / 2,
    y: (circleSegmentIntersection.y + otherCircleSegmentIntersection.y) / 2,
  };
  const p: Point = {
    x: circleSegmentIntersection.x + (mid.x - circleSegmentIntersection.x) * actualSmoothing,
    y: circleSegmentIntersection.y + (mid.y - circleSegmentIntersection.y) * actualSmoothing,
  };
  const toP = direction(p.x - circleCenter.x, p.y - circleCenter.y);
  const curveEnd: Point = {
    x: circleCenter.x + toP.x * actualR,
    y: circleCenter.y + toP.y * actualR,
  };
  const circleTangent = rotate90(
    direction(curveEnd.x - circleCenter.x, curveEnd.y - circleCenter.y),
  );
  const anchorEnd =
    lineIntersection(sideStart, sideDirection, curveEnd, circleTangent) ??
    circleSegmentIntersection;
  const anchorStart: Point = {
    x: (curveStart.x + anchorEnd.x * 2) / 3,
    y: (curveStart.y + anchorEnd.y * 2) / 3,
  };
  return [
    curveStart.x,
    curveStart.y,
    anchorStart.x,
    anchorStart.y,
    anchorEnd.x,
    anchorEnd.y,
    curveEnd.x,
    curveEnd.y,
  ];
}

const reverseCubic = (c: Cubic): Cubic => [c[6], c[7], c[4], c[5], c[2], c[3], c[0], c[1]];

function roundedCorner(p0: Point, p1: Point, p2: Point, r: CornerRounding) {
  const d1 = direction(p0.x - p1.x, p0.y - p1.y);
  const d2 = direction(p2.x - p1.x, p2.y - p1.y);
  const cosAngle = dot(d1, d2);
  const sinAngle = Math.sqrt(1 - cosAngle * cosAngle);
  const expectedRoundCut = sinAngle > 1e-3 ? (r.radius * (cosAngle + 1)) / sinAngle : 0;
  const expectedCut = (1 + r.smoothing) * expectedRoundCut;

  const actualSmoothing = (allowedCut: number) => {
    if (allowedCut > expectedCut) return r.smoothing;
    if (allowedCut > expectedRoundCut) {
      return (r.smoothing * (allowedCut - expectedRoundCut)) / (expectedCut - expectedRoundCut);
    }
    return 0;
  };

  function getCubics(allowedCut0: number, allowedCut1: number): Cubic[] {
    const allowedCut = Math.min(allowedCut0, allowedCut1);
    if (expectedRoundCut < EPSILON || allowedCut < EPSILON || r.radius < EPSILON) {
      return [straightLine(p1.x, p1.y, p1.x, p1.y)];
    }
    const actualRoundCut = Math.min(allowedCut, expectedRoundCut);
    const actualR = (r.radius * actualRoundCut) / expectedRoundCut;
    const centerDistance = Math.sqrt(actualR * actualR + actualRoundCut * actualRoundCut);
    const bisector = direction((d1.x + d2.x) / 2, (d1.y + d2.y) / 2);
    const center: Point = {
      x: p1.x + bisector.x * centerDistance,
      y: p1.y + bisector.y * centerDistance,
    };
    const circleIntersection0: Point = {
      x: p1.x + d1.x * actualRoundCut,
      y: p1.y + d1.y * actualRoundCut,
    };
    const circleIntersection2: Point = {
      x: p1.x + d2.x * actualRoundCut,
      y: p1.y + d2.y * actualRoundCut,
    };

    const flanking0 = flankingCurve(
      actualRoundCut,
      actualSmoothing(allowedCut0),
      p1,
      p0,
      circleIntersection0,
      circleIntersection2,
      center,
      actualR,
    );
    const flanking2 = reverseCubic(
      flankingCurve(
        actualRoundCut,
        actualSmoothing(allowedCut1),
        p1,
        p2,
        circleIntersection2,
        circleIntersection0,
        center,
        actualR,
      ),
    );
    const arc = circularArc(
      center,
      { x: flanking0[6], y: flanking0[7] },
      { x: flanking2[0], y: flanking2[1] },
    );
    return [flanking0, arc, flanking2];
  }

  return { expectedRoundCut, expectedCut, getCubics };
}

export function roundedPolygon(
  vertices: Point[],
  roundings: CornerRounding[],
  centerX: number,
  centerY: number,
): RoundedPolygon {
  const n = vertices.length;
  const corners = vertices.map((v, i) =>
    roundedCorner(vertices[(i + n - 1) % n], v, vertices[(i + 1) % n], roundings[i] ?? UNROUNDED),
  );

  // Two neighboring corners can't cut more than the side between them: shrink them if needed
  const cutAdjusts = vertices.map((v, i) => {
    const a = corners[i];
    const b = corners[(i + 1) % n];
    const next = vertices[(i + 1) % n];
    const expectedRoundCut = a.expectedRoundCut + b.expectedRoundCut;
    const expectedCut = a.expectedCut + b.expectedCut;
    const side = Math.hypot(next.x - v.x, next.y - v.y);
    if (expectedRoundCut > side) return [side / expectedRoundCut, 0];
    if (expectedCut > side)
      return [1, (side - expectedRoundCut) / (expectedCut - expectedRoundCut)];
    return [1, 1];
  });

  const cornerCubics = corners.map((c, i) => {
    const allowed = [0, 1].map((delta) => {
      const [roundCutRatio, cutRatio] = cutAdjusts[(i + n - 1 + delta) % n];
      return c.expectedRoundCut * roundCutRatio + (c.expectedCut - c.expectedRoundCut) * cutRatio;
    });
    return c.getCubics(allowed[0], allowed[1]);
  });

  const cubics: Cubic[] = [];
  for (let i = 0; i < n; i++) {
    const own = cornerCubics[i];
    cubics.push(...own);
    const last = own[own.length - 1];
    const nextStart = cornerCubics[(i + 1) % n][0];
    cubics.push(straightLine(last[6], last[7], nextStart[0], nextStart[1]));
  }
  return { cubics, centerX, centerY };
}

function regularVertices(n: number, radius: number, cx: number, cy: number): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI / n) * 2 * i;
    return { x: radius * Math.cos(angle) + cx, y: radius * Math.sin(angle) + cy };
  });
}

export function regularPolygon(
  n: number,
  radius = 1,
  centerX = 0,
  centerY = 0,
  cornerRounding: CornerRounding = UNROUNDED,
  perVertexRounding?: CornerRounding[],
): RoundedPolygon {
  const roundings = perVertexRounding ?? Array.from({ length: n }, () => cornerRounding);
  return roundedPolygon(regularVertices(n, radius, centerX, centerY), roundings, centerX, centerY);
}

export function circle(n = 8, radius = 1, centerX = 0, centerY = 0): RoundedPolygon {
  const polygonRadius = radius / Math.cos(Math.PI / n);
  return regularPolygon(n, polygonRadius, centerX, centerY, rounding(radius));
}

export function star(
  numVerticesPerRadius: number,
  radius: number,
  innerRadius: number,
  cornerRounding: CornerRounding,
  centerX = 0,
  centerY = 0,
): RoundedPolygon {
  const vertices: Point[] = [];
  for (let i = 0; i < numVerticesPerRadius; i++) {
    const outer = (Math.PI / numVerticesPerRadius) * 2 * i;
    const inner = (Math.PI / numVerticesPerRadius) * (2 * i + 1);
    vertices.push({ x: radius * Math.cos(outer) + centerX, y: radius * Math.sin(outer) + centerY });
    vertices.push({
      x: innerRadius * Math.cos(inner) + centerX,
      y: innerRadius * Math.sin(inner) + centerY,
    });
  }
  return roundedPolygon(
    vertices,
    vertices.map(() => cornerRounding),
    centerX,
    centerY,
  );
}

export function rectangle(
  width: number,
  height: number,
  cornerRounding: CornerRounding,
  perVertexRounding?: CornerRounding[],
  centerX = 0,
  centerY = 0,
): RoundedPolygon {
  const left = centerX - width / 2;
  const top = centerY - height / 2;
  const right = centerX + width / 2;
  const bottom = centerY + height / 2;
  const vertices: Point[] = [
    { x: right, y: bottom },
    { x: left, y: bottom },
    { x: left, y: top },
    { x: right, y: top },
  ];
  const roundings = perVertexRounding ?? vertices.map(() => cornerRounding);
  return roundedPolygon(vertices, roundings, centerX, centerY);
}

// Repeats the template around the center, optionally mirroring every other repeat
function repeatAroundCenter(
  template: Vertex[],
  repeat: number,
  cx: number,
  cy: number,
  mirroring: boolean,
) {
  const radial = template.map(([x, y, r]) => ({
    angle: Math.atan2(y - cy, x - cx),
    distance: Math.hypot(x - cx, y - cy),
    r: r ?? UNROUNDED,
  }));
  const out: { angle: number; distance: number; r: CornerRounding }[] = [];
  let span = (2 * Math.PI) / repeat;

  if (mirroring) {
    const count = repeat * 2;
    span /= 2;
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < radial.length; j++) {
        const reverse = i % 2 !== 0;
        const index = reverse ? radial.length - 1 - j : j;
        const point = radial[index];
        if (index > 0 || !reverse) {
          const angle =
            span * i + (reverse ? span - point.angle + 2 * radial[0].angle : point.angle);
          out.push({ angle, distance: point.distance, r: point.r });
        }
      }
    }
  } else {
    for (let i = 0; i < repeat; i++) {
      for (const point of radial) {
        out.push({ angle: span * i + point.angle, distance: point.distance, r: point.r });
      }
    }
  }

  return out.map(({ angle, distance, r }) => ({
    vertex: { x: distance * Math.cos(angle) + cx, y: distance * Math.sin(angle) + cy },
    rounding: r,
  }));
}

export function customPolygon(
  template: Vertex[],
  repeat: number,
  centerX: number,
  centerY: number,
  mirroring: boolean,
): RoundedPolygon {
  const repeated = repeatAroundCenter(template, repeat, centerX, centerY, mirroring);
  return roundedPolygon(
    repeated.map((v) => v.vertex),
    repeated.map((v) => v.rounding),
    centerX,
    centerY,
  );
}

export function transformed(
  polygon: RoundedPolygon,
  fn: (x: number, y: number) => [number, number],
): RoundedPolygon {
  const [centerX, centerY] = fn(polygon.centerX, polygon.centerY);
  const cubics = polygon.cubics.map((c) => {
    const [a, b] = fn(c[0], c[1]);
    const [d, e] = fn(c[2], c[3]);
    const [f, g] = fn(c[4], c[5]);
    const [h, i] = fn(c[6], c[7]);
    return [a, b, d, e, f, g, h, i] as Cubic;
  });
  return { cubics, centerX, centerY };
}

export const rotated = (polygon: RoundedPolygon, degrees: number) => {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return transformed(polygon, (x, y): [number, number] => [x * cos - y * sin, x * sin + y * cos]);
};

export const scaled = (polygon: RoundedPolygon, sx: number, sy: number) =>
  transformed(polygon, (x, y): [number, number] => [x * sx, y * sy]);

// Moves the center to (0, 0) and scales so the farthest point of the shape is at distance 1,
// so it fits in the unit circle and can rotate around its center
export function normalizeRadial(polygon: RoundedPolygon): Cubic[] {
  let maxSquared = 0;
  for (const c of polygon.cubics) {
    const midX = (c[0] + 3 * c[2] + 3 * c[4] + c[6]) / 8;
    const midY = (c[1] + 3 * c[3] + 3 * c[5] + c[7]) / 8;
    maxSquared = Math.max(
      maxSquared,
      (c[0] - polygon.centerX) ** 2 + (c[1] - polygon.centerY) ** 2,
      (midX - polygon.centerX) ** 2 + (midY - polygon.centerY) ** 2,
    );
  }
  const scale = 1 / Math.sqrt(maxSquared);
  return transformed(polygon, (x, y): [number, number] => [
    (x - polygon.centerX) * scale,
    (y - polygon.centerY) * scale,
  ]).cubics;
}
