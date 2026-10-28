import { useEffect, useRef } from "react";

import { useFontsReady } from "@/hooks/useFontsReady";
import { buildTicketState } from "@/lib/ticket/render/state";
import { TEMPLATES } from "@/lib/ticket/render/templates";
import type { TemplateId } from "@/lib/ticket/ids";
import { usePhotoStore } from "@/stores/photoStore";
import { useTicketerStore } from "@/stores/ticketerStore";

// A small live render of one template, using the current photos, text and style
export function TemplateThumb({ tpl }: { tpl: TemplateId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const settings = useTicketerStore((s) => s.settings);
  const main = usePhotoStore((s) => s.main);
  const stub = usePhotoStore((s) => s.stub);
  const fontsReady = useFontsReady();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !fontsReady) return;

    // Wait for a pause in changes so dragging a slider doesn't redraw every thumbnail
    const timer = setTimeout(() => {
      const state = buildTicketState({ ...settings, tpl }, { main, stub });
      const { canvas: rendered } = TEMPLATES[tpl].render(state, 0.22);
      canvas.width = rendered.width;
      canvas.height = rendered.height;
      canvas.getContext("2d")!.drawImage(rendered, 0, 0);
    }, 120);
    return () => clearTimeout(timer);
  }, [fontsReady, main, settings, stub, tpl]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="h-auto max-h-24 w-auto max-w-[calc(100%-1.5rem)] drop-shadow-md"
    />
  );
}
