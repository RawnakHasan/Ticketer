import { useRef } from "react";

import { useTicketCanvas } from "@/hooks/useTicketCanvas";
import { useTicketerStore } from "@/stores/ticketerStore";

export function TicketPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { preset, warnings } = useTicketCanvas(canvasRef);
  const showSafeArea = useTicketerStore((s) => s.settings.safeOverlay);
  const [top, bottom, side] = preset.safe;
  const hasSafeArea = showSafeArea && (top || bottom || side);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative max-w-full overflow-hidden rounded-xl bg-surface-container-high p-2 lg:p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Live ticket poster preview"
            className="block h-auto max-h-[34dvh] w-auto max-w-full rounded-md lg:max-h-[calc(100dvh-12rem)]"
          />
          {hasSafeArea ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute border-2 border-dashed border-white shadow-[0_0_0_1px_#000a]"
              style={{
                left: `${(side / preset.w) * 100}%`,
                right: `${(side / preset.w) * 100}%`,
                top: `${(top / preset.h) * 100}%`,
                bottom: `${(bottom / preset.h) * 100}%`,
              }}
            />
          ) : null}
        </div>
      </div>

      <p className="text-sm text-on-surface-variant">
        {preset.name} · {preset.w}×{preset.h}
      </p>
      {warnings.length > 0 && (
        <p
          role="status"
          className="rounded-lg bg-secondary-container px-3 py-2 text-sm text-on-secondary-container"
        >
          {warnings.join(". ")}
        </p>
      )}
    </div>
  );
}
