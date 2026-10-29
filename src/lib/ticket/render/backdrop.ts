import { mix, rgb, type RGB } from "../color";
import { drawCover } from "../photo";
import type { BackdropId } from "../ids";
import type { Photo } from "../types";

// Seconds of backdrop animation so far. The preview advances it, exports read it,
// so a saved poster shows the frame that was on screen.
export const backdropClock = { t: 0 };

type Ctx = CanvasRenderingContext2D;

// Moving gradients. `t` is the phase in seconds.
export function drawAnimatedBackdrop(
  c: Ctx,
  W: number,
  H: number,
  acc: RGB,
  mode: "flow" | "aurora",
  t: number,
) {
  const colors = [
    mix(acc, [16, 14, 12], 0.62),
    acc,
    mix([acc[1], acc[2], acc[0]], [255, 250, 240], 0.3),
    mix(acc, [255, 250, 240], 0.55),
  ];

  if (mode === "flow") {
    // A gradient that turns slowly and cross-fades through the four colours
    const angle = t * 0.3;
    const r = Math.hypot(W, H) / 2;
    // The phase can start a hair below zero, so wrap the way that stays positive
    const step = Math.floor(t * 0.12);
    const frac = t * 0.12 - step;
    const at = (i: number) => colors[(((i + step) % 4) + 4) % 4];
    const g = c.createLinearGradient(
      W / 2 - Math.cos(angle) * r,
      H / 2 - Math.sin(angle) * r,
      W / 2 + Math.cos(angle) * r,
      H / 2 + Math.sin(angle) * r,
    );
    for (let i = 0; i < 4; i++) {
      g.addColorStop(i / 3, rgb(mix(at(i), at(i + 1), frac)));
    }
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    return;
  }

  // Three soft blobs drifting over a dark base
  c.fillStyle = rgb(colors[0]);
  c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = "screen";
  for (let i = 0; i < 3; i++) {
    const x = W * (0.5 + 0.38 * Math.sin(t * 0.5 + i * 2.1));
    const y = H * (0.5 + 0.38 * Math.cos(t * 0.4 + i * 1.7));
    const g = c.createRadialGradient(x, y, 0, x, y, Math.max(W, H) * 0.65);
    g.addColorStop(0, `rgba(${colors[i + 1].join(",")},.9)`);
    g.addColorStop(1, `rgba(${colors[i + 1].join(",")},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
  c.globalCompositeOperation = "source-over";
}

// The still backdrops: plain, gradient, and gradient with the photo blurred over it
export function drawStaticBackdrop(
  c: Ctx,
  id: BackdropId,
  acc: RGB,
  main: Photo | null,
  W: number,
  H: number,
) {
  if (id === "plain") {
    c.fillStyle = rgb(mix(acc, [236, 232, 222], 0.84));
    c.fillRect(0, 0, W, H);
    return;
  }

  const g = c.createLinearGradient(0, 0, W * 0.5, H);
  g.addColorStop(0, rgb(mix(acc, [18, 16, 14], 0.6)));
  g.addColorStop(1, rgb(mix(acc, [255, 250, 240], 0.5)));
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  if (id === "blur" && main && "filter" in c) {
    const photo = { ...main, z: 1.2, x: 0, y: 0, rot: 0 };
    drawCover(c, photo, -W * 0.05, -H * 0.05, W * 1.1, H * 1.1, 0, "blur(26px) brightness(.72)");
  }
}
