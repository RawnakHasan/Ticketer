import { Copy, FlipHorizontal2, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { MaterialShape } from "@/components/MaterialShape";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/Button/variant";
import { PhotoCrop } from "@/components/ticket/PhotoCrop";
import { Section, SliderField, SwitchField } from "@/components/ticket/controls";
import { materialShapeNames } from "@/lib/shapes/materialShapes";
import { MAX_STICKERS, getSprite, type Sticker } from "@/lib/ticket/sticker";
import { cn } from "@/lib/utils";
import { useStickerStore } from "@/stores/stickerStore";
import { useTicketerStore } from "@/stores/ticketerStore";

// The finished sticker, small, so you can tell them apart in the list
function StickerThumb({ sticker }: { sticker: Sticker }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const sprite = getSprite(sticker);
    const k = canvas.width / Math.max(sprite.width, sprite.height);
    const g = canvas.getContext("2d")!;
    g.clearRect(0, 0, canvas.width, canvas.height);
    const w = sprite.width * k;
    const h = sprite.height * k;
    g.drawImage(sprite, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }, [sticker]);

  return <canvas ref={ref} width={96} height={96} aria-hidden="true" className="size-12" />;
}

const CHOICE =
  "grid place-items-center rounded-xl text-on-surface-variant outline-none transition-colors hover:bg-on-surface/8 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary aria-pressed:bg-secondary-container aria-pressed:text-on-secondary-container";

// Add pictures to the ticket: transparent PNGs as they are, ordinary photos cropped into a shape.
// Drag them on the ticket to place them.
export function StickerSection() {
  const items = useStickerStore((s) => s.items);
  const selectedId = useStickerStore((s) => s.selectedId);
  const error = useStickerStore((s) => s.error);
  const { add, patch, patchPhoto, select, duplicate, remove, dismissError } =
    useStickerStore.getState();
  const layout = useTicketerStore((s) => s.settings.layout);

  const selected = items.find((s) => s.id === selectedId) ?? null;
  const full = items.length >= MAX_STICKERS;

  return (
    <Section
      title="Stickers"
      hint="Add a transparent PNG, or any photo to crop into a shape. Drag a sticker on the ticket to place it. Drag a corner to resize it and the pink knob to turn it, or pinch with two fingers."
    >
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-xl bg-error-container py-2 ps-4 pe-2 text-sm text-on-error-container"
        >
          <span>{error}</span>
          <Button variant="text" size="xs" onClick={dismissError}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label
          className={cn(
            buttonVariants({ variant: "tonal", size: "xs" }),
            "cursor-pointer",
            "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-secondary",
            full && "pointer-events-none opacity-40",
          )}
        >
          <ImagePlus aria-hidden="true" />
          Add sticker
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={full}
            className="sr-only"
            onChange={async (event) => {
              const files = [...(event.target.files ?? [])];
              event.target.value = "";
              // One after another, so each knows how many stickers are already there
              for (const file of files) await add(file);
            }}
          />
        </label>
        <span className="text-sm text-on-surface-variant">
          {items.length} of {MAX_STICKERS}
        </span>
      </div>

      {items.length > 0 && (
        <div role="group" aria-label="Stickers" className="flex flex-wrap gap-2">
          {items.map((sticker, index) => (
            <button
              key={sticker.id}
              type="button"
              aria-pressed={sticker.id === selectedId}
              aria-label={`Sticker ${index + 1}`}
              onClick={() => select(sticker.id === selectedId ? null : sticker.id)}
              className={cn(
                CHOICE,
                "size-14 bg-surface-container-high",
                "aria-pressed:ring-2 aria-pressed:ring-primary",
              )}
            >
              <StickerThumb sticker={sticker} />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="flex flex-col gap-4 rounded-[1.25rem] bg-surface-container-low p-3">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-on-surface">Shape</span>
            <div role="group" aria-label="Sticker shape" className="flex flex-wrap gap-1">
              <button
                type="button"
                aria-pressed={selected.shape === "cutout"}
                onClick={() => patch(selected.id, { shape: "cutout" })}
                className={cn(CHOICE, "h-11 px-3 text-sm font-medium")}
              >
                Original
              </button>
              {materialShapeNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-label={name}
                  title={name}
                  aria-pressed={selected.shape === name}
                  onClick={() => patch(selected.id, { shape: name })}
                  className={cn(CHOICE, "size-11")}
                >
                  <MaterialShape name={name} className="size-6" />
                </button>
              ))}
            </div>
            {selected.shape === "cutout" && !selected.hasAlpha && (
              <p className="text-sm text-on-surface-variant">
                This picture has no see-through parts, so Original keeps it as a rectangle. Pick a
                shape to crop it.
              </p>
            )}
          </div>

          {selected.shape !== "cutout" && (
            <>
              <PhotoCrop
                photo={selected.photo}
                ratio={1}
                filter=""
                label="Sticker"
                onChange={(change) => patchPhoto(selected.id, change)}
              />
              <SliderField
                label="Zoom"
                value={selected.photo.z}
                min={0.4}
                max={3}
                step={0.05}
                format={(v) => `${v.toFixed(2)}×`}
                onChange={(z) => patchPhoto(selected.id, { z })}
              />
              <div>
                <Button
                  variant="tonal"
                  size="xs"
                  onClick={() => patchPhoto(selected.id, { rot: selected.photo.rot + 1 })}
                >
                  Rotate photo 90°
                </Button>
              </div>
            </>
          )}

          <SliderField
            label="Size"
            value={Math.round(selected.size * 100)}
            min={6}
            max={90}
            format={(v) => `${v}%`}
            onChange={(v) => patch(selected.id, { size: v / 100 })}
          />
          <SliderField
            label="Turn"
            value={selected.rot}
            min={-180}
            max={180}
            format={(v) => `${v}°`}
            onChange={(rot) => patch(selected.id, { rot })}
          />
          <SwitchField
            label="White sticker edge"
            checked={selected.border}
            onChange={(border) => patch(selected.id, { border })}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="tonal"
              size="xs"
              onClick={() => patch(selected.id, { x: 0.5, y: 0.5 })}
            >
              Centre
            </Button>
            <Button
              variant="tonal"
              size="xs"
              aria-pressed={selected.flip}
              onClick={() => patch(selected.id, { flip: !selected.flip })}
            >
              <FlipHorizontal2 aria-hidden="true" />
              Flip
            </Button>
            <Button
              variant="tonal"
              size="xs"
              disabled={full}
              onClick={() => duplicate(selected.id)}
            >
              <Copy aria-hidden="true" />
              Duplicate
            </Button>
            <Button variant="text" size="xs" onClick={() => remove(selected.id)}>
              <Trash2 aria-hidden="true" />
              Remove
            </Button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <p className="text-sm text-on-surface-variant">
          {layout === "single"
            ? "Stickers show on the front."
            : "Dragging works with the One ticket layout, front side. Stickers show on every ticket in the group."}
        </p>
      )}
    </Section>
  );
}
