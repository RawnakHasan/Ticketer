import { create } from "zustand";

import { loadPhoto } from "@/lib/ticket/photo";
import type { Photo, PhotoSlot } from "@/lib/ticket/types";

type PhotoState = {
  main: Photo | null;
  stub: Photo | null;
  error: string;
  add: (slot: PhotoSlot, file: File) => Promise<void>;
  patch: (slot: PhotoSlot, patch: Partial<Photo>) => void;
  clear: (slot: PhotoSlot) => void;
  swap: () => void;
  copyMainToStub: () => void;
  dismissError: () => void;
};

const only = (slot: PhotoSlot, photo: Photo | null): Partial<PhotoState> =>
  slot === "main" ? { main: photo } : { stub: photo };

// Decoded photos can't be saved to localStorage, so they live here and are gone on reload
export const usePhotoStore = create<PhotoState>()((set, get) => ({
  main: null,
  stub: null,
  error: "",
  add: async (slot, file) => {
    try {
      set({ ...only(slot, await loadPhoto(file)), error: "" });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "That file could not be read." });
    }
  },
  patch: (slot, patch) => {
    const photo = get()[slot];
    if (photo) set(only(slot, { ...photo, ...patch }));
  },
  clear: (slot) => set(only(slot, null)),
  swap: () => set((s) => ({ main: s.stub, stub: s.main })),
  copyMainToStub: () => {
    const { main } = get();
    if (main) set({ stub: { ...main, id: crypto.randomUUID(), x: 0, y: 0, z: 1.6 } });
  },
  dismissError: () => set({ error: "" }),
}));
