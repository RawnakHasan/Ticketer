import { create } from "zustand";
import { persist } from "zustand/middleware";

import { hexColor, paletteSchema, type PaletteVariant } from "@/lib/palette/schema";

type PaletteState = {
  seed: string | null;
  variant: PaletteVariant;
  setSeed: (seed: string) => void;
  setVariant: (variant: PaletteVariant) => void;
  reset: () => void;
};

export const PALETTE_STORAGE_KEY = "vite-ui-palette";

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set) => ({
      seed: null,
      variant: "tonalSpot",
      setSeed: (seed) => set({ seed: hexColor.parse(seed).toLowerCase() }),
      setVariant: (variant) => set({ variant }),
      reset: () => set({ seed: null, variant: "tonalSpot" }),
    }),
    {
      name: PALETTE_STORAGE_KEY,
      version: 1,
      partialize: ({ seed, variant }) => ({ seed, variant }),
      // Never trust localStorage: invalid data falls back to defaults
      merge: (persisted, current) => {
        const parsed = paletteSchema.safeParse(persisted);
        return parsed.success ? { ...current, ...parsed.data } : current;
      },
    },
  ),
);
