export type Preset = {
  id: string;
  name: string;
  w: number;
  h: number;
  // Areas apps cover with their own UI, in px: [top, bottom, sides]
  safe: readonly [number, number, number];
  // Exports the ticket on its own, sized to the layout
  bare?: true;
};

export const PRESETS: readonly Preset[] = [
  { id: "ticket", name: "Ticket only", w: 600, h: 1000, safe: [0, 0, 0], bare: true },
  { id: "ig45", name: "Instagram 4:5", w: 1080, h: 1350, safe: [0, 0, 34] },
  { id: "ig11", name: "Instagram 1:1", w: 1080, h: 1080, safe: [0, 0, 0] },
  { id: "story", name: "Story / Reel 9:16", w: 1080, h: 1920, safe: [250, 250, 0] },
  { id: "pin", name: "Pinterest 2:3", w: 1000, h: 1500, safe: [0, 0, 0] },
  { id: "x", name: "X post 16:9", w: 1600, h: 900, safe: [0, 0, 0] },
  { id: "fb", name: "Facebook", w: 1200, h: 630, safe: [0, 0, 0] },
  { id: "li", name: "LinkedIn", w: 1200, h: 627, safe: [0, 0, 0] },
  { id: "ig34", name: "Instagram 3:4", w: 1080, h: 1440, safe: [0, 0, 0] },
  { id: "yt", name: "YouTube thumbnail", w: 1280, h: 720, safe: [0, 0, 0] },
  { id: "desk", name: "Desktop wallpaper", w: 1920, h: 1080, safe: [0, 0, 0] },
  { id: "wall", name: "Phone wallpaper", w: 1170, h: 2532, safe: [300, 220, 0] },
  { id: "post", name: "Postcard 3:2", w: 1800, h: 1200, safe: [0, 0, 0] },
  { id: "custom", name: "Custom size", w: 1080, h: 1080, safe: [0, 0, 0] },
];

export function getPreset(id: string, customW: number, customH: number): Preset {
  const preset = PRESETS.find((p) => p.id === id) ?? PRESETS[1];
  return preset.id === "custom" ? { ...preset, w: customW, h: customH } : preset;
}
