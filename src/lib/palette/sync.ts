import { applyPalette } from "@/lib/palette/generate";
import { PALETTE_STORAGE_KEY, usePaletteStore } from "@/stores/paletteStore";

const apply = ({ seed, variant }: ReturnType<typeof usePaletteStore.getState>) =>
  applyPalette(seed, variant);

apply(usePaletteStore.getState()); // already hydrated: the localStorage read is synchronous
usePaletteStore.subscribe(apply);

// Keep other open tabs in sync
window.addEventListener("storage", (e) => {
  if (e.key === PALETTE_STORAGE_KEY) void usePaletteStore.persist.rehydrate();
});
