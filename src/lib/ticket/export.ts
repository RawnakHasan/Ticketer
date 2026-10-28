import { composeTicket } from "./compose";
import type { Photos } from "./render/state";
import { drawPoster } from "./render/drawPoster";
import type { Settings } from "./settings";

export type PosterFile = { blob: Blob; filename: string; type: "image/png" | "image/jpeg" };

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "ticket";

// Renders the poster at export size. `forcePng` is for the clipboard, which only takes PNG.
export async function renderPosterFile(
  settings: Settings,
  photos: Photos,
  forcePng = false,
): Promise<PosterFile> {
  await document.fonts.ready;

  const { state, preset } = composeTicket(settings, photos);
  const type = forcePng || settings.format === "png" ? "image/png" : "image/jpeg";
  const canvas = document.createElement("canvas");
  canvas.width = preset.w * settings.scale;
  canvas.height = preset.h * settings.scale;
  drawPoster(canvas, preset, state, { transparent: settings.transparent && type === "image/png" });

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("The browser could not encode this size"))),
      type,
      settings.quality / 100,
    ),
  );

  const extension = type === "image/png" ? "png" : "jpg";
  return {
    blob,
    type,
    filename: `ticketer-${slug(settings.fields.title ?? "")}-${preset.id}.${extension}`,
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
