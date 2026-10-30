import { settingsSchema, type Settings } from "./settings";
import { useTicketerStore } from "@/stores/ticketerStore";

// A link that carries the ticket's look and text, so it can be sent to someone. Photos and
// stickers are not in it (they would not fit in a link, and they are the person's own).
// The settings go after the # as compressed text, so they never reach a server.

const PARAM = "t";
// Links longer than this, or settings that unpack to more than the second limit, are not ours.
// The unpacking limit keeps a tiny crafted link from growing into something huge.
const MAX_LINK_CHARS = 16_000;
const MAX_UNPACKED_BYTES = 200_000;

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (text: string) => {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

async function pipe(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
  limit?: number,
) {
  const writer = stream.writable.getWriter();
  void writer.write(bytes as BufferSource).catch(() => {});
  void writer.close().catch(() => {});

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (limit !== undefined && size > limit) {
      await reader.cancel();
      throw new Error("Too large");
    }
    chunks.push(value);
  }

  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

// "1." means compressed. "0." is the plain text, for browsers that cannot compress.
export async function encodeSettings(settings: Settings): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(settings));
  if (typeof CompressionStream === "undefined") return `0.${toBase64Url(json)}`;
  return `1.${toBase64Url(await pipe(json, new CompressionStream("deflate-raw")))}`;
}

// null for anything that is not a valid ticket
export async function decodeSettings(text: string): Promise<Settings | null> {
  try {
    if (text.length > MAX_LINK_CHARS) return null;
    const kind = text.slice(0, 2);
    const body = fromBase64Url(text.slice(2));

    let json: Uint8Array;
    if (kind === "1.") {
      if (typeof DecompressionStream === "undefined") return null;
      json = await pipe(body, new DecompressionStream("deflate-raw"), MAX_UNPACKED_BYTES);
    } else if (kind === "0.") {
      json = body;
    } else {
      return null;
    }

    // Checked like anything saved: whatever is missing gets its default, whatever is wrong fails
    const parsed = settingsSchema.safeParse(JSON.parse(new TextDecoder().decode(json)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function shareUrl(settings: Settings) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${PARAM}=${await encodeSettings(settings)}`;
}

// Opens a shared ticket if the page was reached through a link, then tidies the address bar
export async function importSharedLink() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const shared = hash.get(PARAM);
  if (!shared) return;

  const settings = await decodeSettings(shared);
  if (settings) useTicketerStore.setState({ settings });
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
}
