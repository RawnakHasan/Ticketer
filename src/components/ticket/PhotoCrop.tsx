import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from "react";

import { clamp } from "@/lib/ticket/math";
import { drawCover, panRange } from "@/lib/ticket/photo";
import type { Photo } from "@/lib/ticket/types";

type PhotoCropProps = {
  photo: Photo;
  // Width over height of the frame the photo is cropped to
  ratio: number;
  filter: string;
  label: string;
  onChange: (patch: Partial<Photo>) => void;
};

// A canvas showing exactly what the ticket will show. Drag to pan, arrow keys to nudge, + and - to zoom.
export function PhotoCrop({ photo, ratio, filter, label, onChange }: PhotoCropProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const width = Math.max(300, canvas.clientWidth * 2);
    canvas.width = width;
    canvas.height = Math.round(width / ratio);
    drawCover(canvas.getContext("2d")!, photo, 0, 0, canvas.width, canvas.height, 0, filter);
  }, [photo, ratio, filter]);

  function handleMove(event: PointerEvent<HTMLCanvasElement>) {
    const start = drag.current;
    const canvas = ref.current;
    if (!start || !canvas) return;

    const [rangeX, rangeY] = panRange(photo, canvas.clientWidth, canvas.clientWidth / ratio);
    onChange({
      x: clamp(start.x - (event.clientX - start.px) / (Math.abs(rangeX) < 1 ? 1 : rangeX)),
      y: clamp(start.y - (event.clientY - start.py) / (Math.abs(rangeY) < 1 ? 1 : rangeY)),
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    const changes: Record<string, Partial<Photo>> = {
      ArrowLeft: { x: clamp(photo.x + 0.1) },
      ArrowRight: { x: clamp(photo.x - 0.1) },
      ArrowUp: { y: clamp(photo.y + 0.1) },
      ArrowDown: { y: clamp(photo.y - 0.1) },
      "+": { z: Math.min(3, photo.z + 0.1) },
      "-": { z: Math.max(0.4, photo.z - 0.1) },
    };
    const change = changes[event.key];
    if (change) {
      event.preventDefault();
      onChange(change);
    }
  }

  return (
    <canvas
      ref={ref}
      tabIndex={0}
      role="application"
      aria-label={`${label} crop. Drag or use arrow keys to move, plus and minus to zoom.`}
      style={{ aspectRatio: ratio }}
      className="w-full cursor-grab touch-none rounded-xl bg-surface-container-highest outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary active:cursor-grabbing"
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { px: event.clientX, py: event.clientY, x: photo.x, y: photo.y };
      }}
      onPointerMove={handleMove}
      onPointerUp={() => {
        drag.current = null;
      }}
    />
  );
}
