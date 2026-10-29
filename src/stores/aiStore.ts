import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AiProvider } from "@/lib/ticket/ai";

type AiState = {
  provider: AiProvider;
  keys: Partial<Record<AiProvider, string>>;
  models: Partial<Record<AiProvider, string>>;
  setProvider: (provider: AiProvider) => void;
  setKey: (provider: AiProvider, key: string) => void;
  setModel: (provider: AiProvider, model: string) => void;
};

// Keys are kept in this browser only and go to the provider the person picked, nowhere else
export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      provider: "gemini",
      keys: {},
      models: {},
      setProvider: (provider) => set({ provider }),
      setKey: (provider, key) => set((s) => ({ keys: { ...s.keys, [provider]: key } })),
      setModel: (provider, model) => set((s) => ({ models: { ...s.models, [provider]: model } })),
    }),
    { name: "ticketer-ai", version: 1 },
  ),
);
