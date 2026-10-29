import { create } from "zustand";

import type { Photo } from "@/lib/ticket/types";
import {
  MAX_STICKERS,
  dropSprite,
  loadSticker,
  type Sticker,
  type StickerGuides,
} from "@/lib/ticket/sticker";

type StickerState = {
  // Bottom to top. Like photos, decoded stickers can't be saved, so they are gone on reload.
  items: Sticker[];
  selectedId: string | null;
  // Snap lines shown while a sticker is being dragged
  guides: StickerGuides | null;
  error: string;
  setGuides: (guides: StickerGuides | null) => void;
  add: (file: File) => Promise<void>;
  patch: (id: string, patch: Partial<Omit<Sticker, "id" | "photo">>) => void;
  patchPhoto: (id: string, patch: Partial<Photo>) => void;
  select: (id: string | null) => void;
  // Moves a sticker to the top of the pile and selects it
  raise: (id: string) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  dismissError: () => void;
  // Puts back saved stickers, unless some were added in the meantime
  restore: (items: Sticker[]) => void;
};

const mapOne = (items: Sticker[], id: string, change: (s: Sticker) => Sticker) =>
  items.map((s) => (s.id === id ? change(s) : s));

export const useStickerStore = create<StickerState>()((set, get) => ({
  items: [],
  selectedId: null,
  guides: null,
  error: "",
  setGuides: (guides) =>
    set((s) =>
      // Only a change is worth a redraw
      s.guides?.x === guides?.x && s.guides?.y === guides?.y ? s : { guides },
    ),
  add: async (file) => {
    if (get().items.length >= MAX_STICKERS) {
      set({ error: `A ticket holds up to ${MAX_STICKERS} stickers.` });
      return;
    }
    try {
      const sticker = await loadSticker(file, get().items.length);
      set((s) => ({ items: [...s.items, sticker], selectedId: sticker.id, error: "" }));
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "That file could not be read." });
    }
  },
  patch: (id, patch) => set((s) => ({ items: mapOne(s.items, id, (it) => ({ ...it, ...patch })) })),
  patchPhoto: (id, patch) =>
    set((s) => ({
      items: mapOne(s.items, id, (it) => ({ ...it, photo: { ...it.photo, ...patch } })),
    })),
  select: (selectedId) => set({ selectedId }),
  raise: (id) =>
    set((s) => {
      const top = s.items.find((it) => it.id === id);
      if (!top) return s;
      return { items: [...s.items.filter((it) => it.id !== id), top], selectedId: id };
    }),
  duplicate: (id) => {
    const { items } = get();
    const source = items.find((it) => it.id === id);
    if (!source || items.length >= MAX_STICKERS) return;
    const copy: Sticker = {
      ...source,
      id: crypto.randomUUID(),
      photo: { ...source.photo, id: crypto.randomUUID() },
      x: Math.min(0.95, source.x + 0.06),
      y: Math.min(0.95, source.y + 0.06),
    };
    set({ items: [...items, copy], selectedId: copy.id });
  },
  remove: (id) => {
    dropSprite(id);
    set((s) => ({
      items: s.items.filter((it) => it.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
  },
  dismissError: () => set({ error: "" }),
  restore: (items) => set((s) => (s.items.length ? s : { items })),
}));
