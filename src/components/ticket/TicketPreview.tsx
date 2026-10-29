import { useEffect, useRef, type PointerEvent } from "react";

import { buttonVariants } from "@/components/ui/Button/variant";
import { Button, ToggleButton } from "@/components/ui/Button";
import { useAnimatedBackdrop } from "@/hooks/useAnimatedBackdrop";
import { prefersReducedMotion } from "@/lib/motion-preferences";
import { clamp } from "@/lib/ticket/math";
import type { Preset } from "@/lib/ticket/presets";
import { layoutGroup } from "@/lib/ticket/render/layout";
import { TEMPLATES } from "@/lib/ticket/render/templates";
import { hitSticker } from "@/lib/ticket/sticker";
import type { TicketState } from "@/lib/ticket/render/types";
import { useTicketCanvas } from "@/hooks/useTicketCanvas";
import { cn } from "@/lib/utils";
import { usePhotoStore } from "@/stores/photoStore";
import { useStickerStore } from "@/stores/stickerStore";
import { useTicketerStore } from "@/stores/ticketerStore";
import { useViewStore } from "@/stores/viewStore";

// Where a pointer is on the ticket, as a fraction of its width and height.
// Undoes the poster layout (padding, safe area, tilt) so the stamp lands under the finger.
// `limit` keeps the point inside the ticket. The stamp stays well inside it, stickers may reach the edge.
function pointOnTicket(
  event: PointerEvent<HTMLCanvasElement>,
  preset: Preset,
  state: TicketState,
  limit: [number, number] = [0.08, 0.92],
) {
  const canvas = event.currentTarget;
  const rect = canvas.getBoundingClientRect();
  const u = canvas.width / preset.w;
  const [top, bottom, side] = preset.safe;
  const pad = (preset.bare ? 0 : 56) * u;
  const group = layoutGroup(state.tpl, "single", state.tilt, state.dy);
  const k = Math.min(
    (canvas.width - 2 * pad - 2 * side * u) / group.bounds.w,
    (canvas.height - (top + bottom) * u - 2 * pad) / group.bounds.h,
  );

  const px = ((event.clientX - rect.left) / rect.width) * canvas.width - canvas.width / 2;
  const py =
    ((event.clientY - rect.top) / rect.height) * canvas.height -
    (top * u + (canvas.height - (top + bottom) * u) / 2);
  const a = -group.items[0].r;
  const x = px * Math.cos(a) - py * Math.sin(a);
  const y = px * Math.sin(a) + py * Math.cos(a);
  const [tw, th] = TEMPLATES[state.tpl].size;

  return {
    x: clamp(x / k / tw + 0.5, limit[0], limit[1]),
    y: clamp(y / k / (th + state.dy) + 0.5, limit[0], limit[1]),
    // The ticket's size in design units, for hit testing
    w: tw,
    h: th + state.dy,
  };
}

export function TicketPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backdropRef = useRef<HTMLCanvasElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  // The sticker being dragged, and how far the grab point is from its centre
  const draggingSticker = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const lastLayoutKey = useRef("");

  const { preset, tpl, state, warnings, animated } = useTicketCanvas(canvasRef);
  const settings = useTicketerStore((s) => s.settings);
  const update = useTicketerStore((s) => s.update);
  const main = usePhotoStore((s) => s.main);
  const add = usePhotoStore((s) => s.add);
  const stickers = useStickerStore((s) => s.items);

  const side = useViewStore((s) => s.side);
  const flip = useViewStore((s) => s.flip);
  const printKey = useViewStore((s) => s.printKey);
  const dragStamp = useViewStore((s) => s.dragStamp);
  const gyro = useViewStore((s) => s.gyro);
  const message = useViewStore((s) => s.message);
  const { toggleSide, endFlip, thump, reprint, setGyro, setMessage } = useViewStore.getState();

  const showSafeArea = settings.safeOverlay;
  const [top, bottom, sideSafe] = preset.safe;
  const hasSafeArea = showSafeArea && (top || bottom || sideSafe);
  const canDragStamp =
    dragStamp && settings.layout === "single" && side === "front" && Boolean(settings.show.stamp);
  // Stickers can be dragged on the front of a single ticket, whether or not the stamp is
  const canDragSticker = settings.layout === "single" && side === "front" && stickers.length > 0;
  const canTiltWithPhone =
    typeof window !== "undefined" &&
    "DeviceOrientationEvent" in window &&
    matchMedia("(pointer: coarse)").matches;

  useAnimatedBackdrop(backdropRef, animated, {
    mode: settings.backdrop === "aurora" ? "aurora" : "flow",
    accent: state.acc,
    width: preset.w,
    height: preset.h,
    speed: settings.speed,
    paused: settings.paused,
  });

  // When the template, layout or size changes, the old picture fades out as the new one scales in
  const layoutKey = [tpl, settings.layout, preset.id, preset.w, preset.h].join("|");
  useEffect(() => {
    const canvas = canvasRef.current;
    const previous = lastLayoutKey.current;
    lastLayoutKey.current = layoutKey;
    if (!canvas || !previous || previous === layoutKey) return;
    if (!canvas.dataset.drawn || prefersReducedMotion() || !canvas.parentElement) return;

    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    snapshot.getContext("2d")!.drawImage(canvas, 0, 0);
    snapshot.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;border-radius:6px";
    canvas.parentElement.appendChild(snapshot);
    snapshot.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(1.05)" }], {
      duration: 450,
      easing: "ease-out",
    }).onfinish = () => snapshot.remove();
    canvas.animate(
      [
        { opacity: 0, transform: "scale(.95)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }, [layoutKey]);

  // Phone tilt: the sensors drive the same variables the pointer does
  useEffect(() => {
    if (!gyro) return;
    const el = tiltRef.current;
    const onTilt = (event: DeviceOrientationEvent) => {
      if (!el) return;
      const beta = clamp((event.beta ?? 0) - 45, -30, 30) / 30;
      const gamma = clamp(event.gamma ?? 0, -30, 30) / 30;
      el.style.setProperty("--rx", `${-beta * 10}deg`);
      el.style.setProperty("--ry", `${gamma * 10}deg`);
      el.style.setProperty("--sx", `${(gamma + 1) * 50}%`);
      el.style.setProperty("--sy", `${(beta + 1) * 50}%`);
    };
    addEventListener("deviceorientation", onTilt);
    return () => {
      removeEventListener("deviceorientation", onTilt);
      el?.style.setProperty("--rx", "0deg");
      el?.style.setProperty("--ry", "0deg");
      el?.style.removeProperty("--sx");
      el?.style.removeProperty("--sy");
    };
  }, [gyro]);

  function lean(event: PointerEvent<HTMLDivElement>) {
    if (canDragStamp || draggingSticker.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const style = event.currentTarget.style;
    style.setProperty("--ry", `${x * 10}deg`);
    style.setProperty("--rx", `${-y * 10}deg`);
    style.setProperty("--sx", `${(x + 0.5) * 100}%`);
    style.setProperty("--sy", `${(y + 0.5) * 100}%`);
  }

  function settle(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--ry", "0deg");
    event.currentTarget.style.setProperty("--rx", "0deg");
  }

  async function toggleGyro() {
    if (gyro) {
      setGyro(false);
      return;
    }
    try {
      // iOS asks for permission, other browsers just start sending
      const request = (
        DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      ).requestPermission;
      if (request && (await request()) !== "granted") {
        setMessage("Motion access was declined.");
        return;
      }
      setMessage("");
      setGyro(true);
    } catch {
      setMessage("Motion sensors are not available here.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative max-w-full">
        <div
          ref={tiltRef}
          data-gyro={gyro ? "" : undefined}
          className="tk-tilt relative max-w-full"
          onPointerMove={lean}
          onPointerLeave={settle}
        >
          <div
            className={cn(flip === "out" && "tk-flip-out", flip === "in" && "tk-flip-in")}
            onAnimationEnd={endFlip}
          >
            <div className="relative max-w-full overflow-hidden rounded-xl bg-surface-container-high p-2 lg:p-4">
              <div key={printKey} className="tk-print relative">
                {animated && (
                  <canvas
                    ref={backdropRef}
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full rounded-md"
                  />
                )}
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label={`Live ticket poster preview, ${side}`}
                  style={
                    canDragStamp || canDragSticker
                      ? { cursor: canDragStamp ? "move" : "default", touchAction: "none" }
                      : undefined
                  }
                  className="relative block h-auto max-h-[34dvh] w-auto max-w-full rounded-md lg:max-h-[calc(100dvh-14rem)]"
                  onPointerDown={(event) => {
                    if (canDragSticker) {
                      const at = pointOnTicket(event, preset, state, [-0.2, 1.2]);
                      const hit = hitSticker(stickers, at.x, at.y, at.w, at.h);
                      if (hit) {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        draggingSticker.current = {
                          id: hit.id,
                          dx: hit.x - at.x,
                          dy: hit.y - at.y,
                        };
                        // Grabbing one brings it to the front
                        useStickerStore.getState().raise(hit.id);
                        return;
                      }
                    }
                    if (!canDragStamp) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    dragging.current = true;
                    update({ stampPos: pointOnTicket(event, preset, state) });
                  }}
                  onPointerMove={(event) => {
                    const grab = draggingSticker.current;
                    if (grab) {
                      const at = pointOnTicket(event, preset, state, [-0.2, 1.2]);
                      useStickerStore.getState().patch(grab.id, {
                        x: clamp(at.x + grab.dx, 0, 1),
                        y: clamp(at.y + grab.dy, 0, 1),
                      });
                      return;
                    }
                    if (dragging.current) {
                      update({ stampPos: pointOnTicket(event, preset, state) });
                      return;
                    }
                    if (canDragSticker) {
                      // A grab cursor over a sticker, so it is clear it can be picked up
                      const at = pointOnTicket(event, preset, state, [-0.2, 1.2]);
                      const over = hitSticker(stickers, at.x, at.y, at.w, at.h);
                      event.currentTarget.style.cursor = over
                        ? "grab"
                        : canDragStamp
                          ? "move"
                          : "default";
                    }
                  }}
                  onPointerUp={() => {
                    if (draggingSticker.current) {
                      draggingSticker.current = null;
                      return;
                    }
                    if (!dragging.current) return;
                    dragging.current = false;
                    thump();
                  }}
                />
                {hasSafeArea ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute border-2 border-dashed border-white shadow-[0_0_0_1px_#000a]"
                    style={{
                      left: `${(sideSafe / preset.w) * 100}%`,
                      right: `${(sideSafe / preset.w) * 100}%`,
                      top: `${(top / preset.h) * 100}%`,
                      bottom: `${(bottom / preset.h) * 100}%`,
                    }}
                  />
                ) : null}
                <div className="tk-sheen" />
              </div>
            </div>
          </div>
        </div>

        {!main && (
          <label
            className={cn(
              buttonVariants({ variant: "filled", size: "sm" }),
              "absolute inset-x-0 bottom-4 mx-auto w-max",
              "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-secondary",
            )}
          >
            Add main photo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void add("main", file);
                event.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
        <Button variant="text" size="xs" onClick={reprint}>
          Reprint
        </Button>
        <ToggleButton
          variant="outlined"
          size="xs"
          pressed={side === "back"}
          onPressedChange={toggleSide}
        >
          {side === "back" ? "Show front" : "Show back"}
        </ToggleButton>
        {canTiltWithPhone && (
          <ToggleButton variant="outlined" size="xs" pressed={gyro} onPressedChange={toggleGyro}>
            Tilt with phone
          </ToggleButton>
        )}
      </div>

      <p className="text-sm text-on-surface-variant">
        {preset.name} · {preset.w}×{preset.h}
        {tpl !== settings.tpl ? ` · ${TEMPLATES[tpl].label}` : ""}
      </p>
      {message && (
        <p
          role="alert"
          className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container"
        >
          {message}
        </p>
      )}
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
