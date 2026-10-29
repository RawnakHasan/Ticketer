import { composeTicket } from "./compose";
import { PRESETS } from "./presets";
import type { Photos } from "./render/state";
import { drawPoster } from "./render/drawPoster";
import type { Settings } from "./settings";

export type PosterFile = { blob: Blob; filename: string; type: string };

type ImageType = "image/png" | "image/jpeg";

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "ticket";

const extensionOf = (type: ImageType) => (type === "image/png" ? "png" : "jpg");

// Draws one side of the ticket at export size and encodes it
async function renderImage(
  settings: Settings,
  photos: Photos,
  type: ImageType,
  back: boolean,
): Promise<Blob> {
  const { state, preset } = composeTicket(settings, photos, { back });
  const canvas = document.createElement("canvas");
  canvas.width = preset.w * settings.scale;
  canvas.height = preset.h * settings.scale;
  drawPoster(canvas, preset, state, { transparent: settings.transparent && type === "image/png" });
  return encode(canvas, type, settings.quality);
}

const encode = (canvas: HTMLCanvasElement, type: ImageType, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("The browser could not encode this size"))),
      type,
      quality / 100,
    ),
  );

// JSZip is only needed for the .zip exports, so it loads when one is asked for
async function zipOf(files: { name: string; blob: Blob }[]) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const { name, blob } of files) zip.file(name, blob);
  return zip.generateAsync({ type: "blob" });
}

// Renders the poster at export size. `forcePng` is for the clipboard, which only takes PNG.
// With the side set to "both" the result is a .zip with the front and the back.
export async function renderPosterFile(
  settings: Settings,
  photos: Photos,
  forcePng = false,
): Promise<PosterFile> {
  await document.fonts.ready;

  const type: ImageType = forcePng || settings.format === "png" ? "image/png" : "image/jpeg";
  const ext = extensionOf(type);
  const { preset } = composeTicket(settings, photos);
  const base = `ticketer-${slug(settings.fields.title ?? "")}-${preset.id}`;

  if (settings.exportSide === "both" && !forcePng) {
    const blob = await zipOf([
      { name: `front.${ext}`, blob: await renderImage(settings, photos, type, false) },
      { name: `back.${ext}`, blob: await renderImage(settings, photos, type, true) },
    ]);
    return { blob, type: "application/zip", filename: `${base}-front-back.zip` };
  }

  const blob = await renderImage(settings, photos, type, settings.exportSide === "back");
  return { blob, type, filename: `${base}.${ext}` };
}

// One image per size in a .zip. Sizes that aren't a fixed canvas (ticket only, custom) are left out.
export async function renderAllSizes(settings: Settings, photos: Photos): Promise<PosterFile> {
  await document.fonts.ready;

  const type: ImageType = settings.format === "png" ? "image/png" : "image/jpeg";
  const ext = extensionOf(type);
  const title = slug(settings.fields.title ?? "");
  const files: { name: string; blob: Blob }[] = [];

  for (const preset of PRESETS) {
    if (preset.bare || preset.id === "custom") continue;
    // Each size is composed on its own, so "recompose" can pick a template per size
    const forSize = { ...settings, presetId: preset.id };
    const { state } = composeTicket(forSize, photos, { back: settings.exportSide === "back" });
    const canvas = document.createElement("canvas");
    canvas.width = preset.w * settings.scale;
    canvas.height = preset.h * settings.scale;
    drawPoster(canvas, preset, state);
    files.push({
      name: `ticketer-${title}-${preset.id}.${ext}`,
      blob: await encode(canvas, type, settings.quality),
    });
  }

  return {
    blob: await zipOf(files),
    type: "application/zip",
    filename: "ticketer-all-sizes.zip",
  };
}

export function downloadFile({ blob, filename }: PosterFile) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareFile(file: PosterFile, title: string) {
  const shared = new File([file.blob], file.filename, { type: file.type });
  if (!navigator.canShare?.({ files: [shared] })) return false;
  await navigator.share({ files: [shared], title });
  return true;
}

export async function copyFile(file: PosterFile) {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": file.blob })]);
}
