import { useEffect, useState, type RefObject } from "react";

import { composeTicket } from "@/lib/ticket/compose";
import { isAnimatedBackdrop } from "@/lib/ticket/ids";
import { notifyPreviewDrawn, previewCanvases } from "@/lib/ticket/previewBus";
import { drawPoster } from "@/lib/ticket/render/drawPoster";
import { useFontsReady } from "@/hooks/useFontsReady";
import { usePhotoStore } from "@/stores/photoStore";
import { useStickerStore } from "@/stores/stickerStore";
import { useTicketerStore } from "@/stores/ticketerStore";
import { useViewStore } from "@/stores/viewStore";

// Longest side of the preview bitmap. Exports are drawn separately at full size.
const PREVIEW_PX = 1100;

export function useTicketCanvas(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const settings = useTicketerStore((s) => s.settings);
  const main = usePhotoStore((s) => s.main);
  const stub = usePhotoStore((s) => s.stub);
  const stickers = useStickerStore((s) => s.items);
  const selectedSticker = useStickerStore((s) => s.selectedId);
  const side = useViewStore((s) => s.side);
  const stampScale = useViewStore((s) => s.stampScale);
  const fontsReady = useFontsReady();
  const [warnings, setWarnings] = useState<string[]>([]);

  const { state, preset, tpl } = composeTicket(
    settings,
    { main, stub, stickers },
    { back: side === "back", stampScale, selectedSticker },
  );
  // The moving backdrop is drawn on its own canvas behind this one, so the poster is drawn without it
  const animated = isAnimatedBackdrop(state.backdrop);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fontsReady) return;

    // One draw per frame, however fast a slider moves
    const frame = requestAnimationFrame(() => {
      const k = PREVIEW_PX / Math.max(preset.w, preset.h);
      canvas.width = Math.round(preset.w * k);
      canvas.height = Math.round(preset.h * k);
      const next = drawPoster(canvas, preset, state, {
        transparent: settings.transparent,
        noBackdrop: animated,
      });
      setWarnings((prev) => (prev.join("|") === next.join("|") ? prev : next));
      canvas.dataset.drawn = "1";
      previewCanvases.poster = canvas;
      notifyPreviewDrawn();
    });
    return () => cancelAnimationFrame(frame);
  }, [canvasRef, fontsReady, preset, state, animated, settings.transparent]);

  return { preset, tpl, state, warnings, animated };
}
