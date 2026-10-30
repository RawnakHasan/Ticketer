import { Redo2, Undo2 } from "lucide-react";
import { useEffect, useRef, type PointerEvent } from "react";

import { buttonVariants } from "@/components/ui/Button/variant";
import { Button, ToggleButton } from "@/components/ui/Button";
import { useAnimatedBackdrop } from "@/hooks/useAnimatedBackdrop";
import { prefersReducedMotion } from "@/lib/motion-preferences";
import { clamp } from "@/lib/ticket/math";
import type { Preset } from "@/lib/ticket/presets";
import { layoutGroup } from "@/lib/ticket/render/layout";
import { TEMPLATES } from "@/lib/ticket/render/templates";
import { hitHandle, hitSticker, onSide } from "@/lib/ticket/sticker";
import { VISION_FILTERS, VISION_IDS, VISION_LABELS, visionFilter } from "@/lib/ticket/vision";
import type { TicketState } from "@/lib/ticket/render/types";
import { useTicketCanvas } from "@/hooks/useTicketCanvas";
import { cn } from "@/lib/utils";
import { useHistoryStore } from "@/stores/historyStore";
import { usePhotoStore } from "@/stores/photoStore";
import { useStickerStore } from "@/stores/stickerStore";
import { useTicketerStore } from "@/stores/ticketerStore";
import { useViewStore } from "@/stores/viewStore";

// Slides the foil's shine along its bands as the ticket tilts. `x` and `y` are how far the pointer
// or the phone is from the middle, -0.5 to 0.5. Does nothing without foil.
function moveFoil(x: number, y: number) {
  const { foil, foilAngle } = useTicketerStore.getState().settings;
  if (foil === "off") return;
  const rad = (foilAngle * Math.PI) / 180;
  const shift = clamp(0.5 + x * Math.cos(rad) + y * Math.sin(rad), 0, 1);
  const view = useViewStore.getState();
  // Each change redraws the ticket, so only a real movement counts
  if (Math.abs(view.foilShift - shift) > 0.015) view.setFoilShift(shift);
}

// Keeps an angle in -180 to 180 degrees
const wrapDegrees = (degrees: number) => ((((degrees + 180) % 360) + 360) % 360) - 180;

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
    // How many of those units one CSS pixel on screen covers, to give fingertips some reach
    unit: canvas.width / rect.width / k,
  };
}

export function TicketPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backdropRef = useRef<HTMLCanvasElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  // The sticker being dragged, and how far the grab point is from its centre
  const draggingSticker = useRef<{ id: string; dx: number; dy: number } | null>(null);
  // A corner or the rotate knob being dragged: where the sticker started
  const handleDrag = useRef<{
    kind: "resize" | "rotate";
    id: string;
    size: number;
    dist: number;
  } | null>(null);
  // Fingers on the ticket, for pinching a sticker bigger or smaller and turning it
  const fingers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{
    id: string;
    dist: number;
    angle: number;
    size: number;
    rot: number;
  } | null>(null);
  const lastLayoutKey = useRef("");

  const { preset, tpl, state, warnings, animated } = useTicketCanvas(canvasRef);
  const settings = useTicketerStore((s) => s.settings);
  const update = useTicketerStore((s) => s.update);
  const main = usePhotoStore((s) => s.main);
  const add = usePhotoStore((s) => s.add);
  const stickers = useStickerStore((s) => s.items);
  const selectedStickerId = useStickerStore((s) => s.selectedId);

  const side = useViewStore((s) => s.side);
  // Only the stickers on the side being shown can be grabbed
  const onThisSide = stickers.filter((s) => onSide(s, side));
  const vision = useViewStore((s) => s.vision);
  const setVision = useViewStore((s) => s.setVision);
  const flip = useViewStore((s) => s.flip);
  const printKey = useViewStore((s) => s.printKey);
  const dragStamp = useViewStore((s) => s.dragStamp);
  const gyro = useViewStore((s) => s.gyro);
  const message = useViewStore((s) => s.message);
  const { toggleSide, endFlip, thump, reprint, setGyro, setMessage } = useViewStore.getState();

  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);
  const { undo, redo } = useHistoryStore.getState();

  const showSafeArea = settings.safeOverlay;
  const [top, bottom, sideSafe] = preset.safe;
  const hasSafeArea = showSafeArea && (top || bottom || sideSafe);
  const canDragStamp =
    dragStamp && settings.layout === "single" && side === "front" && Boolean(settings.show.stamp);
  // Stickers can be dragged on the front of a single ticket, whether or not the stamp is
  const canDragSticker = settings.layout === "single" && onThisSide.length > 0;
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
      moveFoil(gamma / 2, beta / 2);
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
    if (canDragStamp || draggingSticker.current || handleDrag.current || pinch.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const style = event.currentTarget.style;
    style.setProperty("--ry", `${x * 10}deg`);
    style.setProperty("--rx", `${-y * 10}deg`);
    moveFoil(x, y);
    style.setProperty("--sx", `${(x + 0.5) * 100}%`);
    style.setProperty("--sy", `${(y + 0.5) * 100}%`);
  }

  function settle(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.setProperty("--ry", "0deg");
    event.currentTarget.style.setProperty("--rx", "0deg");
    moveFoil(0, 0);
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
              {/* The colour filters the "Preview as" menu applies. Nothing is drawn by this. */}
              <svg aria-hidden="true" width="0" height="0" className="absolute">
                {VISION_FILTERS.map(({ id, values }) => (
                  <filter key={id} id={`tk-vision-${id}`} colorInterpolationFilters="linearRGB">
                    <feColorMatrix type="matrix" values={values} />
                  </filter>
                ))}
              </svg>
              <div
                key={printKey}
                className="tk-print relative"
                style={{ filter: visionFilter(vision) }}
              >
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
                    fingers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

                    // A second finger on a selected sticker: pinch it
                    const chosen = onThisSide.find((s) => s.id === selectedStickerId);
                    if (canDragSticker && chosen && fingers.current.size === 2) {
                      const [a, b] = [...fingers.current.values()];
                      draggingSticker.current = null;
                      handleDrag.current = null;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      pinch.current = {
                        id: chosen.id,
                        dist: Math.hypot(b.x - a.x, b.y - a.y) || 1,
                        angle: Math.atan2(b.y - a.y, b.x - a.x),
                        size: chosen.size,
                        rot: chosen.rot,
                      };
                      return;
                    }

                    if (canDragSticker) {
                      const at = pointOnTicket(event, preset, state, [-0.2, 1.2]);
                      // The selected sticker's handles come first, they sit on top of everything
                      const grabbed = chosen
                        ? hitHandle(chosen, at.x, at.y, at.w, at.h, 14 * at.unit)
                        : null;
                      if (chosen && grabbed) {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        handleDrag.current = {
                          kind: grabbed,
                          id: chosen.id,
                          size: chosen.size,
                          dist: Math.hypot((at.x - chosen.x) * at.w, (at.y - chosen.y) * at.h) || 1,
                        };
                        return;
                      }
                      const hit = hitSticker(onThisSide, at.x, at.y, at.w, at.h);
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
                    if (fingers.current.has(event.pointerId)) {
                      fingers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
                    }

                    const pinching = pinch.current;
                    if (pinching && fingers.current.size >= 2) {
                      const [a, b] = [...fingers.current.values()];
                      const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
                      const angle = Math.atan2(b.y - a.y, b.x - a.x);
                      useStickerStore.getState().patch(pinching.id, {
                        size: clamp((pinching.size * dist) / pinching.dist, 0.06, 0.9),
                        rot: wrapDegrees(pinching.rot + ((angle - pinching.angle) * 180) / Math.PI),
                      });
                      return;
                    }

                    const handle = handleDrag.current;
                    if (handle) {
                      const at = pointOnTicket(event, preset, state, [-0.2, 1.2]);
                      const sticker = onThisSide.find((s) => s.id === handle.id);
                      if (!sticker) return;
                      const dx = (at.x - sticker.x) * at.w;
                      const dy = (at.y - sticker.y) * at.h;
                      if (handle.kind === "resize") {
                        useStickerStore.getState().patch(handle.id, {
                          size: clamp((handle.size * Math.hypot(dx, dy)) / handle.dist, 0.06, 0.9),
                        });
                      } else {
                        // The knob sits straight above the sticker, so "up" is zero degrees.
                        // It clicks to every 15 degrees when it comes close.
                        const raw = wrapDegrees((Math.atan2(dy, dx) * 180) / Math.PI + 90);
                        const nearest = Math.round(raw / 15) * 15;
                        useStickerStore.getState().patch(handle.id, {
                          rot: Math.abs(raw - nearest) < 4 ? wrapDegrees(nearest) : Math.round(raw),
                        });
                      }
                      return;
                    }

                    const grab = draggingSticker.current;
                    if (grab) {
                      const at = pointOnTicket(event, preset, state, [-0.2, 1.2]);
                      let x = clamp(at.x + grab.dx, 0, 1);
                      let y = clamp(at.y + grab.dy, 0, 1);
                      // Snaps to the middle of the ticket, with a guide line while it holds
                      const near = 0.018;
                      const snapX = Math.abs(x - 0.5) < near;
                      const snapY = Math.abs(y - 0.5) < near;
                      if (snapX) x = 0.5;
                      if (snapY) y = 0.5;
                      const store = useStickerStore.getState();
                      store.setGuides(snapX || snapY ? { x: snapX, y: snapY } : null);
                      store.patch(grab.id, { x, y });
                      return;
                    }
                    if (dragging.current) {
                      update({ stampPos: pointOnTicket(event, preset, state) });
                      return;
                    }
                    if (canDragSticker) {
                      // A grab cursor over a sticker, a resize or turn cursor over its handles
                      const at = pointOnTicket(event, preset, state, [-0.2, 1.2]);
                      const chosen = onThisSide.find((s) => s.id === selectedStickerId);
                      const onHandle = chosen
                        ? hitHandle(chosen, at.x, at.y, at.w, at.h, 14 * at.unit)
                        : null;
                      const over = hitSticker(onThisSide, at.x, at.y, at.w, at.h);
                      event.currentTarget.style.cursor =
                        onHandle === "rotate"
                          ? "alias"
                          : onHandle === "resize"
                            ? "nwse-resize"
                            : over
                              ? "grab"
                              : canDragStamp
                                ? "move"
                                : "default";
                    }
                  }}
                  onPointerUp={(event) => {
                    fingers.current.delete(event.pointerId);
                    if (pinch.current) {
                      // Lifting one finger ends the pinch. The other one does not start a drag.
                      if (fingers.current.size < 2) pinch.current = null;
                      return;
                    }
                    if (handleDrag.current) {
                      handleDrag.current = null;
                      return;
                    }
                    if (draggingSticker.current) {
                      draggingSticker.current = null;
                      useStickerStore.getState().setGuides(null);
                      return;
                    }
                    if (!dragging.current) return;
                    dragging.current = false;
                    thump();
                  }}
                  onPointerCancel={(event) => {
                    fingers.current.delete(event.pointerId);
                    pinch.current = null;
                    handleDrag.current = null;
                    draggingSticker.current = null;
                    dragging.current = false;
                    useStickerStore.getState().setGuides(null);
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
        <Button variant="text" size="xs" disabled={!canUndo} onClick={undo} title="Undo (Ctrl+Z)">
          <Undo2 aria-hidden="true" />
          Undo
        </Button>
        <Button
          variant="text"
          size="xs"
          disabled={!canRedo}
          onClick={redo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 aria-hidden="true" />
          Redo
        </Button>
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
        <label className="flex items-center gap-2 text-sm text-on-surface-variant">
          Preview as
          <select
            value={vision}
            onChange={(event) => setVision(event.target.value as typeof vision)}
            title="Only changes this preview. Downloads keep the real colours."
            className="h-8 rounded-full border border-outline bg-surface px-3 text-sm text-on-surface outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary"
          >
            {VISION_IDS.map((id) => (
              <option key={id} value={id}>
                {VISION_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
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
