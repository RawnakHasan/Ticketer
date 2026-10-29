import { create } from "zustand";

import { prefersReducedMotion } from "@/lib/motion-preferences";
import type { SideId } from "@/lib/ticket/ids";

// How the preview is being looked at right now. None of it is saved or exported.
type ViewState = {
  side: SideId;
  // The flip is two halves: the ticket turns edge-on ("out"), the side changes, it turns back ("in")
  flip: "out" | "in" | null;
  // Stamp scale, above 1 for a moment after the stamp is placed
  stampScale: number;
  dragStamp: boolean;
  gyro: boolean;
  // Changing it replays the print-in animation
  printKey: number;
  message: string;
  showBack: () => void;
  toggleSide: () => void;
  endFlip: () => void;
  thump: () => void;
  reprint: () => void;
  setDragStamp: (on: boolean) => void;
  setGyro: (on: boolean) => void;
  setMessage: (message: string) => void;
};

const FLIP_HALF_MS = 240;

export const useViewStore = create<ViewState>()((set, get) => ({
  side: "front",
  flip: null,
  stampScale: 1,
  dragStamp: false,
  gyro: false,
  printKey: 0,
  message: "",
  showBack: () => set({ side: "back" }),
  toggleSide: () => {
    const next = get().side === "back" ? "front" : "back";
    if (prefersReducedMotion()) {
      set({ side: next, flip: null });
      return;
    }
    set({ flip: "out" });
    setTimeout(() => set({ side: next, flip: "in" }), FLIP_HALF_MS);
  },
  endFlip: () => set((s) => (s.flip === "in" ? { flip: null } : s)),
  thump: () => {
    if (prefersReducedMotion()) return;
    const start = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      set({ stampScale: t < 1 ? 1 + 0.55 * Math.exp(-6 * t) * Math.cos(t * 14) : 1 });
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  },
  reprint: () => set((s) => ({ printKey: s.printKey + 1 })),
  setDragStamp: (dragStamp) => set({ dragStamp }),
  setGyro: (gyro) => set({ gyro }),
  setMessage: (message) => set({ message }),
}));
