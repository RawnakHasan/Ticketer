// Ways of looking at the preview as someone with colour blindness would see it, to check that
// text, accent and paper still stand apart without colour. For the preview only: exports are
// never changed.
export const VISION_IDS = [
  "none",
  "protanopia",
  "deuteranopia",
  "tritanopia",
  "achromatopsia",
] as const;
export type VisionId = (typeof VISION_IDS)[number];

// Rows of the red, green and blue mix for each output colour. Values after Machado et al. (2009)
// at full severity, applied in linear light. Achromatopsia is plain brightness.
const MATRICES: Record<Exclude<VisionId, "none">, [number, number, number][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
  achromatopsia: [
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
    [0.2126, 0.7152, 0.0722],
  ],
};

export const VISION_LABELS: Record<VisionId, string> = {
  none: "Normal vision",
  protanopia: "Protanopia (no red)",
  deuteranopia: "Deuteranopia (no green)",
  tritanopia: "Tritanopia (no blue)",
  achromatopsia: "Greyscale",
};

export const VISION_FILTERS = (Object.keys(MATRICES) as Exclude<VisionId, "none">[]).map((id) => ({
  id,
  // feColorMatrix wants four rows of five numbers: red, green, blue, alpha and an offset
  values: [...MATRICES[id].flatMap((row) => [...row, 0, 0]), 0, 0, 0, 1, 0].join(" "),
}));

export const visionFilter = (id: VisionId) => (id === "none" ? undefined : `url(#tk-vision-${id})`);
