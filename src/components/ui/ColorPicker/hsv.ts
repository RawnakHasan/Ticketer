export type HSV = { h: number; s: number; v: number }; // h: 0–360, s and v: 0–1

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function hexToHsv(hex: string): HSV {
  const n = Number.parseInt(hex.slice(1, 7), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToHex({ h, s, v }: HSV): string {
  const channel = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const hex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(channel(5))}${hex(channel(3))}${hex(channel(1))}`;
}

/** "abc", "#ABC" or "#aabbcc" -> "#aabbcc". Anything else -> null. */
export function normalizeHex(input: string): string | null {
  let v = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(v)) v = v.replace(/./g, "$&$&");
  return /^[0-9a-f]{6}$/i.test(v) ? `#${v.toLowerCase()}` : null;
}
