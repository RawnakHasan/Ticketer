import { useEffect, useState, type RefObject } from "react";

import { composeTicket } from "@/lib/ticket/compose";
import { drawPoster } from "@/lib/ticket/render/drawPoster";
import { useFontsReady } from "@/hooks/useFontsReady";
import { usePhotoStore } from "@/stores/photoStore";
import { useTicketerStore } from "@/stores/ticketerStore";

// Longest side of the preview bitmap. Exports are drawn separately at full size.
const PREVIEW_PX = 1100;

export function useTicketCanvas(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const settings = useTicketerStore((s) => s.settings);
  const main = usePhotoStore((s) => s.main);
  const stub = usePhotoStore((s) => s.stub);
  const fontsReady = useFontsReady();
  const [warnings, setWarnings] = useState<string[]>([]);

  const { state, preset } = composeTicket(settings, { main, stub });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fontsReady) return;

    // One draw per frame, however fast a slider moves
    const frame = requestAnimationFrame(() => {
      const k = PREVIEW_PX / Math.max(preset.w, preset.h);
      canvas.width = Math.round(preset.w * k);
      canvas.height = Math.round(preset.h * k);
      const next = drawPoster(canvas, preset, state);
      setWarnings((prev) => (prev.join("|") === next.join("|") ? prev : next));
    });
    return () => cancelAnimationFrame(frame);
  }, [canvasRef, fontsReady, preset, state]);

  return { preset, warnings };
}
