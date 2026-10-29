import { create } from "zustand";
import { persist } from "zustand/middleware";

// Whether photos and stickers are kept in this browser between visits. On by default, and
// easy to turn off, because it stores the person's own pictures on their device.
type SessionState = {
  remember: boolean;
  setRemember: (remember: boolean) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      remember: true,
      setRemember: (remember) => set({ remember }),
    }),
    {
      name: "ticketer-session",
      version: 1,
      partialize: ({ remember }) => ({ remember }),
      // Anything unreadable in localStorage means "use the default"
      merge: (persisted, current) => {
        const remember = (persisted as { remember?: unknown } | undefined)?.remember;
        return typeof remember === "boolean" ? { ...current, remember } : current;
      },
    },
  ),
);
