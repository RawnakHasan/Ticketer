import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { FieldKey } from "@/lib/ticket/fields";
import {
  settingsSchema,
  type Adjust,
  type MainShape,
  type Settings,
  type StubArea,
} from "@/lib/ticket/settings";

type TicketerState = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  updateStubArea: (patch: Partial<StubArea>) => void;
  updateMainShape: (patch: Partial<MainShape>) => void;
  updateAdjust: (patch: Partial<Adjust>) => void;
  setField: (key: FieldKey, value: string) => void;
  setShow: (key: string, value: boolean) => void;
  setFields: (patch: Partial<Record<FieldKey, string>>) => void;
  reset: () => void;
};

export const TICKETER_STORAGE_KEY = "ticketer-settings";

const defaults = () => settingsSchema.parse({});

export const useTicketerStore = create<TicketerState>()(
  persist(
    (set) => ({
      settings: defaults(),
      update: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      updateStubArea: (patch) =>
        set((s) => ({
          settings: { ...s.settings, stubArea: { ...s.settings.stubArea, ...patch } },
        })),
      updateMainShape: (patch) =>
        set((s) => ({
          settings: { ...s.settings, mainShape: { ...s.settings.mainShape, ...patch } },
        })),
      updateAdjust: (patch) =>
        set((s) => ({ settings: { ...s.settings, adjust: { ...s.settings.adjust, ...patch } } })),
      setField: (key, value) =>
        set((s) => ({
          settings: { ...s.settings, fields: { ...s.settings.fields, [key]: value } },
        })),
      setFields: (patch) =>
        set((s) => ({ settings: { ...s.settings, fields: { ...s.settings.fields, ...patch } } })),
      setShow: (key, value) =>
        set((s) => ({ settings: { ...s.settings, show: { ...s.settings.show, [key]: value } } })),
      reset: () => set({ settings: defaults() }),
    }),
    {
      name: TICKETER_STORAGE_KEY,
      version: 1,
      partialize: ({ settings }) => ({ settings }),
      // Never trust localStorage: invalid data falls back to defaults
      merge: (persisted, current) => {
        const parsed = settingsSchema.safeParse(
          (persisted as { settings?: unknown } | undefined)?.settings,
        );
        return parsed.success ? { ...current, settings: parsed.data } : current;
      },
    },
  ),
);
