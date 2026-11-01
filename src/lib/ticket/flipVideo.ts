import { composeTicket } from "./compose";
import type { PosterFile } from "./export";
import { drawPoster } from "./render/drawPoster";
import { drawAnimatedBackdrop, drawStaticBackdrop } from "./render/backdrop";
import type { Photos } from "./render/state";
import type { Settings } from "./settings";

// A short loop of the ticket turning over to show its back and turning back, over the backdrop.
// It is recorded as it plays, so it takes as long as the video is: about three seconds.

// Seconds: rest on the front, turn, rest on the back, turn back, a moment on the front
const HOLD_FRONT = 0.5;
const TURN = 0.8;
const HOLD_BACK = 1.0;
const TAIL = 0.2;
export const FLIP_SECONDS = HOLD_FRONT + TURN + HOLD_BACK + TURN + TAIL;

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

// How far the ticket has turned at time `t`: 0 shows the front, pi the back
export function flipAngle(t: number): number {
  if (t < HOLD_FRONT) return 0;
  if (t < HOLD_FRONT + TURN) return ease((t - HOLD_FRONT) / TURN) * Math.PI;
  if (t < HOLD_FRONT + TURN + HOLD_BACK) return Math.PI;
  if (t < HOLD_FRONT + 2 * TURN + HOLD_BACK) {
    return (1 - ease((t - HOLD_FRONT - TURN - HOLD_BACK) / TURN)) * Math.PI;
  }
  return 0;
}

// One frame: the backdrop, then the ticket seen at its turn. A ticket turning on its edge gets
// narrower, and a little taller as the near edge swings towards the viewer.
export function drawFlipFrame(
  c: CanvasRenderingContext2D,
  W: number,
  H: number,
  drawBackdrop: (c: CanvasRenderingContext2D, t: number) => void,
  front: HTMLCanvasElement,
  back: HTMLCanvasElement,
  t: number,
) {
  drawBackdrop(c, t);

  const angle = flipAngle(t);
  const face = angle < Math.PI / 2 ? front : back;
  const fit = Math.min((W * 0.78) / front.width, (H * 0.8) / front.height);
  const dw = front.width * fit;
  const dh = front.height * fit;

  const across = Math.max(0.015, Math.abs(Math.cos(angle)));
  const lift = 1 + 0.045 * Math.sin(angle);

  c.save();
  c.translate(W / 2, H / 2);
  c.scale(across, lift);
  c.shadowColor = "rgba(0,0,0,.38)";
  c.shadowBlur = (W / 1080) * 46;
  c.shadowOffsetY = (W / 1080) * 26;
  c.drawImage(face, -dw / 2, -dh / 2, dw, dh);
  c.restore();
}

// One side of the ticket on its own with see-through corners, at `width` pixels across
function ticketFace(settings: Settings, photos: Photos, back: boolean, width: number) {
  const { state, preset } = composeTicket(
    { ...settings, presetId: "ticket", layout: "single", tilt: 0 },
    photos,
    { back },
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round((width * preset.h) / preset.w);
  drawPoster(canvas, preset, state, { transparent: true });
  return canvas;
}

// Video formats to try, best first. Safari records MP4, Chrome and Firefox record WebM.
const FORMATS = [
  "video/mp4;codecs=avc1.42E01E",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

export async function recordFlip(
  settings: Settings,
  photos: Photos,
  onProgress?: (fraction: number) => void,
): Promise<PosterFile> {
  if (typeof MediaRecorder === "undefined") throw new Error("This browser cannot record video.");
  const mime = FORMATS.find((format) => MediaRecorder.isTypeSupported(format));
  if (!mime) throw new Error("This browser cannot record video.");

  await document.fonts.ready;

  // The video is the size of the chosen poster, kept within what phones play happily. A plain
  // "ticket only" export has no backdrop to turn over, so it gets the 4:5 post size.
  const wanted = composeTicket(settings, photos).preset;
  const framed = wanted.bare
    ? composeTicket({ ...settings, presetId: "ig45" }, photos)
    : composeTicket(settings, photos);
  const scale = Math.min(1, 1920 / Math.max(framed.preset.w, framed.preset.h));
  const W = Math.round((framed.preset.w * scale) / 2) * 2;
  const H = Math.round((framed.preset.h * scale) / 2) * 2;

  const faceWidth = Math.round(Math.min(W * 0.78, 1100));
  const front = ticketFace(settings, photos, false, faceWidth);
  const back = ticketFace(settings, photos, true, faceWidth);

  const { backdrop, acc, main } = framed.state;
  // Gradients that move are drawn every frame. Still ones are drawn once and copied.
  let still: HTMLCanvasElement | null = null;
  const drawBackdrop = (c: CanvasRenderingContext2D, t: number) => {
    if (backdrop === "flow" || backdrop === "aurora") {
      drawAnimatedBackdrop(c, W, H, acc, backdrop, t);
      return;
    }
    if (!still) {
      still = document.createElement("canvas");
      still.width = W;
      still.height = H;
      drawStaticBackdrop(still.getContext("2d")!, backdrop, acc, main, W, H);
    }
    c.drawImage(still, 0, 0);
  };

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d")!;
  drawFlipFrame(c, W, H, drawBackdrop, front, back, 0);

  const recorder = new MediaRecorder(canvas.captureStream(30), {
    mimeType: mime,
    videoBitsPerSecond: 8_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const finished = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve();
    recorder.onerror = () => reject(new Error("The recording failed."));
  });

  recorder.start();
  const begin = performance.now();
  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      const t = (now - begin) / 1000;
      if (t >= FLIP_SECONDS) {
        // End on the same picture the video starts with, so it loops without a jump
        drawFlipFrame(c, W, H, drawBackdrop, front, back, FLIP_SECONDS);
        resolve();
        return;
      }
      drawFlipFrame(c, W, H, drawBackdrop, front, back, t);
      onProgress?.(t / FLIP_SECONDS);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  // The last picture needs a moment to reach the recorder before it is told to stop
  await new Promise((resolve) => setTimeout(resolve, 120));
  recorder.stop();
  await finished;

  const type = mime.split(";")[0];
  const title =
    (settings.fields.title ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "ticket";
  return {
    blob: new Blob(chunks, { type }),
    type,
    filename: `ticketer-${title}-flip.${type === "video/mp4" ? "mp4" : "webm"}`,
  };
}
