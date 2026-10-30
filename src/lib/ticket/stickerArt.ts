// The built-in sticker pack. Each design is drawn on a 100 by 100 grid with two colours:
// `a` is the main colour (the one you can change), `b` is for the details on top of it
// (eyes, stitching, a tick) and is picked to stay readable against `a`.

type Point = [number, number];

const pts = (list: Point[]) => list.map(([x, y]) => `${+x.toFixed(2)},${+y.toFixed(2)}`).join(" ");

// A star with `n` points, alternating between the outer and inner radius
function star(n: number, outer: number, inner: number, cx = 50, cy = 50): string {
  const list: Point[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    list.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  return pts(list);
}

// A point `r` away from the middle, at `deg` degrees
const around = (deg: number, r: number): Point => [
  50 + Math.cos((deg * Math.PI) / 180) * r,
  50 + Math.sin((deg * Math.PI) / 180) * r,
];

// Soft corners for pointy shapes, drawn as a thick stroke in the same colour
const soft = (a: string, width = 6) =>
  `fill="${a}" stroke="${a}" stroke-width="${width}" stroke-linejoin="round"`;

export type StickerArt = {
  id: string;
  label: string;
  draw: (a: string, b: string) => string;
};

export const STICKER_ART: StickerArt[] = [
  {
    id: "star",
    label: "Star",
    draw: (a) => `<polygon ${soft(a)} points="${star(5, 40, 18)}"/>`,
  },
  {
    id: "sparkle",
    label: "Sparkle",
    draw: (a) =>
      `<path fill="${a}" d="M50 4C54 34 66 46 96 50C66 54 54 66 50 96C46 66 34 54 4 50C34 46 46 34 50 4Z"/>`,
  },
  {
    id: "heart",
    label: "Heart",
    draw: (a) =>
      `<path fill="${a}" d="M50 90C8 60 4 32 22 19C37 9 50 21 50 30C50 21 63 9 78 19C96 32 92 60 50 90Z"/>`,
  },
  {
    id: "bolt",
    label: "Lightning",
    draw: (a) => `<polygon ${soft(a, 5)} points="60,6 22,54 45,54 38,94 78,42 55,42"/>`,
  },
  {
    id: "burst",
    label: "Burst",
    draw: (a, b) =>
      `<polygon ${soft(a, 3)} points="${star(16, 47, 38)}"/>` +
      `<circle cx="50" cy="50" r="30" fill="none" stroke="${b}" stroke-width="3" stroke-dasharray="3 5" stroke-linecap="round"/>`,
  },
  {
    id: "smile",
    label: "Smiley",
    draw: (a, b) =>
      `<circle cx="50" cy="50" r="45" fill="${a}"/>` +
      `<circle cx="35" cy="40" r="6" fill="${b}"/><circle cx="65" cy="40" r="6" fill="${b}"/>` +
      `<path d="M28 58Q50 82 72 58" fill="none" stroke="${b}" stroke-width="7" stroke-linecap="round"/>`,
  },
  {
    id: "flower",
    label: "Flower",
    draw: (a, b) =>
      [0, 60, 120, 180, 240, 300]
        .map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return `<circle cx="${+(50 + Math.cos(rad) * 26).toFixed(2)}" cy="${+(50 + Math.sin(rad) * 26).toFixed(2)}" r="19" fill="${a}"/>`;
        })
        .join("") + `<circle cx="50" cy="50" r="14" fill="${b}"/>`,
  },
  {
    id: "crown",
    label: "Crown",
    draw: (a, b) =>
      `<polygon ${soft(a, 5)} points="10,80 8,32 30,54 50,20 70,54 92,32 90,80"/>` +
      `<circle cx="30" cy="68" r="5" fill="${b}"/><circle cx="50" cy="68" r="5" fill="${b}"/><circle cx="70" cy="68" r="5" fill="${b}"/>`,
  },
  {
    id: "tape",
    label: "Tape",
    draw: (a) =>
      `<polygon fill="${a}" fill-opacity=".82" points="4,30 96,30 92,38 96,46 92,54 96,62 96,70 4,70 8,62 4,54 8,46 4,38 8,30"/>` +
      `<rect x="14" y="30" width="72" height="40" fill="#fff" fill-opacity=".18"/>`,
  },
  {
    id: "arrow",
    label: "Arrow",
    draw: (a) =>
      `<path d="M14 76C24 30 58 22 76 50" fill="none" stroke="${a}" stroke-width="9" stroke-linecap="round"/>` +
      `<polygon ${soft(a, 4)} points="92,64 60,60 82,34"/>`,
  },
  {
    id: "check",
    label: "Tick",
    draw: (a, b) =>
      `<circle cx="50" cy="50" r="45" fill="${a}"/>` +
      `<path d="M29 52L44 67L72 35" fill="none" stroke="${b}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    id: "note",
    label: "Music",
    draw: (a) =>
      `<path d="M38 72V24L76 14V62" fill="none" stroke="${a}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<ellipse cx="28" cy="74" rx="14" ry="10" fill="${a}" transform="rotate(-18 28 74)"/>` +
      `<ellipse cx="66" cy="64" rx="14" ry="10" fill="${a}" transform="rotate(-18 66 64)"/>`,
  },
  {
    id: "moon",
    label: "Moon",
    draw: (a) => `<path fill="${a}" d="M62 8A43 43 0 1 0 92 66A34 34 0 0 1 62 8Z"/>`,
  },
  {
    id: "sun",
    label: "Sun",
    draw: (a) =>
      `<circle cx="50" cy="50" r="22" fill="${a}"/>` +
      [0, 45, 90, 135, 180, 225, 270, 315]
        .map((deg) => {
          const [x1, y1] = around(deg, 33);
          const [x2, y2] = around(deg, 46);
          return `<line x1="${+x1.toFixed(2)}" y1="${+y1.toFixed(2)}" x2="${+x2.toFixed(2)}" y2="${+y2.toFixed(2)}" stroke="${a}" stroke-width="7" stroke-linecap="round"/>`;
        })
        .join(""),
  },
  {
    id: "ticket",
    label: "Ticket",
    draw: (a, b) =>
      `<path fill="${a}" d="M8 26H92V42A8 8 0 0 0 92 58V74H8V58A8 8 0 0 0 8 42Z"/>` +
      `<line x1="66" y1="30" x2="66" y2="70" stroke="${b}" stroke-width="3" stroke-dasharray="4 4" stroke-linecap="round"/>` +
      `<polygon fill="${b}" points="${star(5, 13, 6, 36, 50)}"/>`,
  },
  {
    id: "cloud",
    label: "Cloud",
    draw: (a) =>
      `<path fill="${a}" d="M26 76A19 19 0 0 1 24 38A25 25 0 0 1 72 32A22 22 0 0 1 74 76Z"/>`,
  },
];

export const artById = (id: string) => STICKER_ART.find((art) => art.id === id);

// The finished SVG. `a` and `b` are any CSS colours.
export const artSvg = (art: StickerArt, a: string, b: string, size = 100) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${art.draw(a, b)}</svg>`;
