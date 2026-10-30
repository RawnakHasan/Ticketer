import { usePhotoStore } from "@/stores/photoStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useStickerStore } from "@/stores/stickerStore";
import { loadPhoto } from "./photo";
import type { Sticker } from "./sticker";
import type { Photo } from "./types";

// Keeps the person's photos and stickers in IndexedDB, so a reload brings them back.
// Settings already persist on their own. The image files are stored once each, under their id,
// and a small record says which is which and how each is cropped and placed.

const DB_NAME = "ticketer";
const STORE = "kv";

// What is kept about a photo besides the file itself: its crop
type PhotoRecord = Pick<Photo, "id" | "z" | "x" | "y" | "rot">;
type StickerRecord = Omit<Sticker, "photo"> & { photo: PhotoRecord };
type SessionRecord = {
  main: PhotoRecord | null;
  stub: PhotoRecord | null;
  stickers: StickerRecord[];
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const request = work(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const read = <T>(key: string) => run<T | undefined>("readonly", (s) => s.get(key));
const write = (key: string, value: unknown) => run("readwrite", (s) => s.put(value, key));
const remove = (key: string) => run("readwrite", (s) => s.delete(key));
const wipe = () => run("readwrite", (s) => s.clear());

// Ids of image files already in the database, so a crop drag doesn't rewrite them
const stored = new Set<string>();

const cropOf = ({ id, z, x, y, rot }: Photo): PhotoRecord => ({ id, z, x, y, rot });

async function save() {
  const { main, stub } = usePhotoStore.getState();
  const { items } = useStickerStore.getState();
  const photos = [main, stub, ...items.map((s) => s.photo)].filter((p): p is Photo => p !== null);

  for (const photo of photos) {
    if (stored.has(photo.id)) continue;
    await write(`file:${photo.id}`, photo.src);
    stored.add(photo.id);
  }

  const record: SessionRecord = {
    main: main && cropOf(main),
    stub: stub && cropOf(stub),
    stickers: items.map((s) => ({ ...s, photo: cropOf(s.photo) })),
  };
  await write("session", record);

  // Files nobody uses any more
  const live = new Set(photos.map((p) => p.id));
  for (const id of [...stored]) {
    if (live.has(id)) continue;
    await remove(`file:${id}`);
    stored.delete(id);
  }
}

// One save at a time, a moment after the last change
let timer: ReturnType<typeof setTimeout> | undefined;
let queue: Promise<void> = Promise.resolve();

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    queue = queue.then(save).catch((error) => console.warn("Could not save photos", error));
  }, 500);
}

async function reload(record: PhotoRecord): Promise<Photo | null> {
  try {
    const blob = await read<Blob>(`file:${record.id}`);
    if (!blob) return null;
    const photo = await loadPhoto(new File([blob], "saved", { type: blob.type }));
    stored.add(record.id);
    return { ...photo, ...record };
  } catch {
    return null;
  }
}

async function restore() {
  const record = await read<SessionRecord>("session");
  if (!record) return;

  const [main, stub] = await Promise.all([
    record.main ? reload(record.main) : null,
    record.stub ? reload(record.stub) : null,
  ]);
  const stickers: Sticker[] = [];
  for (const saved of record.stickers) {
    const photo = await reload(saved.photo);
    // Stickers saved before sides and pack designs existed get these defaults
    const older: Pick<Sticker, "side" | "art" | "flip"> = { side: "front", art: null, flip: false };
    if (photo) stickers.push({ ...older, ...saved, photo });
  }

  usePhotoStore.getState().restore(main, stub);
  useStickerStore.getState().restore(stickers);
}

// Removes every saved photo and sticker
async function forgetSavedPhotos() {
  clearTimeout(timer);
  stored.clear();
  try {
    await wipe();
  } catch {
    /* nothing stored, or storage unavailable */
  }
}

// Call once at start-up. Brings back saved photos, then keeps saving while it is switched on.
export async function startSession() {
  let unsubscribe: (() => void)[] = [];

  const begin = () => {
    unsubscribe = [
      usePhotoStore.subscribe((s, prev) => {
        if (s.main !== prev.main || s.stub !== prev.stub) schedule();
      }),
      useStickerStore.subscribe((s, prev) => {
        if (s.items !== prev.items) schedule();
      }),
    ];
    schedule();
  };

  if (useSessionStore.getState().remember) {
    try {
      await restore();
    } catch (error) {
      console.warn("Could not restore photos", error);
    }
    begin();
  }

  useSessionStore.subscribe((s, prev) => {
    if (s.remember === prev.remember) return;
    if (s.remember) {
      begin();
    } else {
      unsubscribe.forEach((off) => off());
      unsubscribe = [];
      void forgetSavedPhotos();
    }
  });
}
