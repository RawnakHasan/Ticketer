import { autoInk, rgb, type RGB } from "./color";
import { artById, artSvg } from "./stickerArt";
import { loadPhoto } from "./photo";
import type { Photo } from "./types";

const ART_PX = 512;

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not make the image."))),
      "image/png",
    );
  });
}

// Crops away the empty, see-through border round a picture, so a cutout is only as big as what is
// in it. `pad` is the margin to keep, as a fraction of the picture's longest side.
export function trimToContent(
  source: CanvasImageSource & { width: number; height: number },
  pad = 0.03,
) {
  const { width, height } = source;
  const full = document.createElement("canvas");
  full.width = width;
  full.height = height;
  const g = full.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(source, 0, 0);

  const data = g.getImageData(0, 0, width, height).data;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  // Nothing in it at all: leave it as it is
  if (right < 0) return full;

  const margin = Math.round(Math.max(width, height) * pad);
  const x0 = Math.max(0, left - margin);
  const y0 = Math.max(0, top - margin);
  const x1 = Math.min(width, right + 1 + margin);
  const y1 = Math.min(height, bottom + 1 + margin);

  const out = document.createElement("canvas");
  out.width = x1 - x0;
  out.height = y1 - y0;
  out.getContext("2d")!.drawImage(full, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

// A pack design in one colour, as a picture like any other. The detail colour is picked to read
// against it, and the empty space round the design is trimmed off.
export async function loadArtPhoto(artId: string, color: RGB): Promise<Photo> {
  const art = artById(artId);
  if (!art) throw new Error("That sticker is not in the pack.");

  const svg = artSvg(art, rgb(color), rgb(autoInk(color)), ART_PX);
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not draw that sticker."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = ART_PX;
  canvas.getContext("2d")!.drawImage(image, 0, 0, ART_PX, ART_PX);

  const blob = await canvasToBlob(trimToContent(canvas));
  return loadPhoto(new File([blob], `${artId}.png`, { type: "image/png" }));
}

// Takes the background out of a picture, leaving a see-through cutout of what is in front.
// The model runs in the browser (nothing is uploaded). It is about 40 MB, downloaded the first
// time this is used and cached by the browser after that, so it is loaded only on demand.
//
// @imgly/background-removal is licensed AGPL-3.0, a commercial licence is available from IMG.LY.
// This is the one place it is used, so another model can replace it here.
export async function cutOutBackground(
  source: Blob,
  onProgress?: (fraction: number) => void,
): Promise<File> {
  const { removeBackground } = await import("@imgly/background-removal");
  const result = await removeBackground(source, {
    model: "isnet_quint8",
    output: { format: "image/png" },
    progress: (_key, current, total) => onProgress?.(total ? current / total : 0),
  });

  const bitmap = await createImageBitmap(result);
  const blob = await canvasToBlob(trimToContent(bitmap));
  bitmap.close();
  return new File([blob], "cutout.png", { type: "image/png" });
}
