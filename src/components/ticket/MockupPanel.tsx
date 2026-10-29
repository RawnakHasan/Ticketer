import { useEffect, useRef, useSyncExternalStore } from "react";

import { Card } from "@/components/ui/Card";
import { previewCanvases, previewVersion, subscribePreview } from "@/lib/ticket/previewBus";
import { cn } from "@/lib/utils";

const MOCKUPS = [
  { name: "Feed", ratio: 4 / 5, width: 110 },
  { name: "Story", ratio: 9 / 16, width: 92 },
  { name: "Pin", ratio: 2 / 3, width: 104 },
] as const;

// How the poster looks cropped for a feed post, a story and a pin
export function MockupPanel() {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  const version = useSyncExternalStore(subscribePreview, previewVersion);

  useEffect(() => {
    const { poster, backdrop } = previewCanvases;
    if (!poster) return;

    MOCKUPS.forEach(({ ratio }, i) => {
      const canvas = refs.current[i];
      if (!canvas) return;
      const w = (canvas.width = 240);
      const h = (canvas.height = Math.round(240 / ratio));
      const g = canvas.getContext("2d")!;
      // Cover the frame with the poster, like object-fit: cover
      const q = Math.max(w / poster.width, h / poster.height);
      const dw = poster.width * q;
      const dh = poster.height * q;
      g.fillStyle = "#111";
      g.fillRect(0, 0, w, h);
      if (backdrop) g.drawImage(backdrop, (w - dw) / 2, (h - dh) / 2, dw, dh);
      g.drawImage(poster, (w - dw) / 2, (h - dh) / 2, dw, dh);
    });
  }, [version]);

  return (
    <Card variant="outlined" className="gap-3 p-4">
      <h3 className="text-base font-medium text-on-surface">How it looks</h3>
      <div className="flex flex-wrap gap-3">
        {MOCKUPS.map(({ name, ratio, width }, i) => (
          <figure key={name} style={{ width }} className="flex flex-col gap-1">
            <div
              style={{ aspectRatio: ratio }}
              className="relative overflow-hidden rounded-xl border border-outline-variant bg-black"
            >
              <canvas
                ref={(el) => {
                  refs.current[i] = el;
                }}
                aria-hidden="true"
                className="block h-full w-full"
              />
              {name === "Story" && (
                <>
                  <span className="absolute inset-x-2 top-2 h-1.5 rounded-full bg-white/60" />
                  <span
                    className={cn("absolute inset-x-2 bottom-2 h-4 rounded-full bg-white/60")}
                  />
                </>
              )}
            </div>
            <figcaption className="text-xs text-on-surface-variant">{name}</figcaption>
          </figure>
        ))}
      </div>
    </Card>
  );
}
