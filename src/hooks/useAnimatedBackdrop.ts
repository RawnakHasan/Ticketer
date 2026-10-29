import { useEffect, type RefObject } from "react";

import type { RGB } from "@/lib/ticket/color";
import { backdropClock, drawAnimatedBackdrop } from "@/lib/ticket/render/backdrop";
import { prefersReducedMotion } from "@/lib/motion-preferences";
import { previewCanvases } from "@/lib/ticket/previewBus";

type Options = {
  mode: "flow" | "aurora";
  accent: RGB;
  // Size the canvas to the poster's shape
  width: number;
  height: number;
  speed: number;
  paused: boolean;
};

// Runs the moving backdrop on a small canvas behind the poster. Exports read the clock it advances.
export function useAnimatedBackdrop(
  ref: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
  { mode, accent, width, height, speed, paused }: Options,
) {
  const accentKey = accent.join(",");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !enabled) return;

    const longest = Math.max(width, height);
    canvas.width = Math.round((width / longest) * 320);
    canvas.height = Math.round((height / longest) * 320);
    previewCanvases.backdrop = canvas;
    const g = canvas.getContext("2d")!;
    const draw = () =>
      drawAnimatedBackdrop(g, canvas.width, canvas.height, accent, mode, backdropClock.t);
    draw();
    if (paused || prefersReducedMotion()) return;

    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // A frame timestamp can be slightly older than the time the loop started
      backdropClock.t += (Math.max(0, now - last) / 1000) * speed;
      last = now;
      draw();
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
    // `accent` is compared through accentKey, it is a new array on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, enabled, mode, accentKey, width, height, speed, paused]);
}
