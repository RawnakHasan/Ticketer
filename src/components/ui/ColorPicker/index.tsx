import { Popover } from "@base-ui/react/popover";
import { Pipette } from "lucide-react";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { clamp01, hexToHsv, hsvToHex, normalizeHex, type HSV } from "./hsv";

// Not in lib.dom yet. Chromium browsers only, so the button hides itself elsewhere.
type EyeDropperConstructor = new () => { open: () => Promise<{ sRGBHex: string }> };
const EyeDropperApi =
  typeof window === "undefined"
    ? undefined
    : (window as unknown as { EyeDropper?: EyeDropperConstructor }).EyeDropper;

const HUE_GRADIENT = "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)";

// The range input sits invisibly over a gradient track, so only the thumb is styled. The WebKit
// and Firefox rules must stay separate (one selector list with an unknown pseudo is dropped), and
// every class is written out in full so Tailwind can find it.
const HUE_INPUT = cn(
  "absolute inset-0 size-full cursor-pointer appearance-none bg-transparent outline-none",
  "[&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent",
  "[&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-(--hue) [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgb(0_0_0/0.35)]",
  "[&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-(--hue) [&::-moz-range-thumb]:shadow-[0_0_0_1px_rgb(0_0_0/0.35)]",
  "[&:focus-visible::-webkit-slider-thumb]:outline-3 [&:focus-visible::-webkit-slider-thumb]:outline-offset-2 [&:focus-visible::-webkit-slider-thumb]:outline-secondary",
  "[&:focus-visible::-moz-range-thumb]:outline-3 [&:focus-visible::-moz-range-thumb]:outline-offset-2 [&:focus-visible::-moz-range-thumb]:outline-secondary",
);

type ColorPickerProps = Omit<Popover.Trigger.Props, "className" | "onChange" | "value"> & {
  className?: string;
  /** Names the picker for screen readers */
  label: string;
  /** #rrggbb */
  value: string;
  onChange: (hex: string) => void;
};

/**
 * A colour picker in a popover. The children are the trigger button's content, so the caller
 * decides what the swatch looks like. Trigger styling goes in className / style.
 */
export function ColorPicker({
  label,
  value,
  onChange,
  className,
  children,
  ...triggerProps
}: ColorPickerProps) {
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value));
  const [seen, setSeen] = useState(value);
  const [draft, setDraft] = useState<string | null>(null); // hex while it's being typed
  const areaRef = useRef<HTMLDivElement>(null);

  // Follow outside changes (a reset, a typed hex). When our own change just comes back around,
  // keep the hue we have: a grey or black has no hue of its own to recover from the hex.
  if (value !== seen) {
    setSeen(value);
    if (hsvToHex(hsv) !== value.toLowerCase()) setHsv(hexToHsv(value));
  }

  const current = hsvToHex(hsv);
  const hueColor = `hsl(${hsv.h} 100% 50%)`;
  const shownHex = draft ?? current;
  const hexInvalid = draft !== null && normalizeHex(draft) === null;

  function apply(next: HSV) {
    setHsv(next);
    setDraft(null);
    onChange(hsvToHex(next));
  }

  function fromPointer(e: PointerEvent<HTMLDivElement>) {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    apply({
      h: hsv.h,
      s: clamp01((e.clientX - rect.left) / rect.width),
      v: 1 - clamp01((e.clientY - rect.top) / rect.height),
    });
  }

  function onAreaKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 0.1 : 0.01;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    apply({ h: hsv.h, s: clamp01(hsv.s + move[0]), v: clamp01(hsv.v + move[1]) });
  }

  async function pickFromScreen() {
    if (!EyeDropperApi) return;
    try {
      const { sRGBHex } = await new EyeDropperApi().open();
      const hex = normalizeHex(sRGBHex);
      if (hex) apply(hexToHsv(hex));
    } catch {
      // Cancelled with Esc
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger aria-label={label} className={className} {...triggerProps}>
        {children}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={8}
          className="z-50"
        >
          <Popover.Popup
            className={cn(
              "w-64 max-w-[calc(100vw-2rem)] origin-(--transform-origin) space-y-4 rounded-[28px] bg-surface-container-highest p-4 text-on-surface shadow-md outline-none",
              "transition-[opacity,scale] duration-150 motion-reduce:transition-none",
              "data-starting-style:scale-95 data-starting-style:opacity-0",
              "data-ending-style:scale-95 data-ending-style:opacity-0",
            )}
          >
            <Popover.Title className="sr-only">{label}</Popover.Title>

            {/* Saturation (left to right) and brightness (bottom to top) */}
            <div
              ref={areaRef}
              role="slider"
              tabIndex={0}
              aria-label="Saturation and brightness"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(hsv.s * 100)}
              aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                fromPointer(e);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e);
              }}
              onKeyDown={onAreaKeyDown}
              className="relative h-40 w-full cursor-crosshair touch-none rounded-2xl outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              style={{
                backgroundColor: hueColor,
                backgroundImage:
                  "linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent)",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute size-5 -translate-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
                style={{
                  left: `${hsv.s * 100}%`,
                  top: `${(1 - hsv.v) * 100}%`,
                  backgroundColor: current,
                }}
              />
            </div>

            <div className="relative h-6" style={{ "--hue": hueColor } as CSSProperties}>
              <div
                aria-hidden
                className="absolute inset-x-3 top-1 h-4 rounded-full"
                style={{ background: HUE_GRADIENT }}
              />
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                aria-label="Hue"
                value={Math.round(hsv.h)}
                onChange={(e) => apply({ ...hsv, h: Number(e.target.value) })}
                className={HUE_INPUT}
              />
            </div>

            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-10 shrink-0 rounded-full border border-outline-variant"
                style={{ background: current }}
              />
              <input
                aria-label={`${label} hex`}
                aria-invalid={hexInvalid}
                value={shownHex}
                maxLength={7}
                spellCheck={false}
                onChange={(e) => {
                  const text = e.target.value.trim();
                  setDraft(text.startsWith("#") ? text : `#${text}`);
                  // Apply as soon as it's a full 6-digit colour
                  if (/^#?[0-9a-f]{6}$/i.test(text)) {
                    const hex = normalizeHex(text);
                    if (hex) {
                      setHsv(hexToHsv(hex));
                      onChange(hex);
                    }
                  }
                }}
                onBlur={() => {
                  // Also accept 3-digit shorthand when leaving the field
                  const hex = draft ? normalizeHex(draft) : null;
                  if (hex) apply(hexToHsv(hex));
                  setDraft(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="h-10 min-w-0 flex-1 rounded-full border border-outline bg-transparent px-4 font-mono text-sm text-on-surface outline-none focus:border-primary aria-invalid:border-error"
              />
              {EyeDropperApi && (
                <Button
                  variant="tonal"
                  size="xs"
                  aria-label="Pick a colour from the screen"
                  onClick={() => void pickFromScreen()}
                >
                  <Pipette className="size-4" />
                </Button>
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
