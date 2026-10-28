import { clamp } from "../math";
import { shownAspect } from "../photo";
import type { MainShape } from "../settings";
import type { Photo } from "../types";
import type { Template } from "./types";

// Size of the main photo frame: [width, height, extra height over the template's base]
// With "auto", the frame follows the photo's own aspect ratio, within what the template can hold.
export function mainFrame(
  box: Template["photoBox"],
  shape: MainShape,
  main: Photo | null,
  stubWidth: number,
): [number, number, number] {
  const [boxW, boxH, minScale, maxScale] = box;
  const w = ((boxW || 836 - stubWidth) * shape.w) / 100;
  let h = (boxH * shape.h) / 100;

  if (shape.auto && main) h = w / shownAspect(main);

  h = clamp(h, boxH * minScale, boxH * maxScale);
  return [w, h, h - boxH];
}
