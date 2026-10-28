import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Section, SliderField } from "@/components/ticket/controls";
import { PhotoCrop } from "@/components/ticket/PhotoCrop";
import { cn } from "@/lib/utils";
import { smartCrop, shownAspect } from "@/lib/ticket/photo";
import type { PhotoSlot as Slot } from "@/lib/ticket/types";
import { usePhotoStore } from "@/stores/photoStore";

type PhotoSlotProps = {
  slot: Slot;
  label: string;
  // Width over height of the frame this photo fills on the ticket
  ratio: number;
  filter: string;
  hint?: string;
};

export function PhotoSlot({ slot, label, ratio, filter, hint }: PhotoSlotProps) {
  const photo = usePhotoStore((s) => s[slot]);
  const add = usePhotoStore((s) => s.add);
  const patch = usePhotoStore((s) => s.patch);
  const clear = usePhotoStore((s) => s.clear);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <Section
      title={label}
      action={
        photo && (
          <Button variant="text" size="xs" onClick={() => clear(slot)}>
            Remove
          </Button>
        )
      }
    >
      {photo ? (
        <>
          <PhotoCrop
            photo={photo}
            ratio={ratio}
            filter={filter}
            label={label}
            onChange={(change) => patch(slot, change)}
          />
          <SliderField
            label="Zoom"
            value={photo.z}
            min={0.4}
            max={3}
            step={0.05}
            format={(v) => `${v.toFixed(2)}×`}
            onChange={(z) => patch(slot, { z })}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="tonal" size="xs" onClick={() => patch(slot, { rot: photo.rot + 1 })}>
              Rotate 90°
            </Button>
            <Button variant="tonal" size="xs" onClick={() => patch(slot, smartCrop(photo))}>
              Smart crop
            </Button>
            <Button
              variant="tonal"
              size="xs"
              onClick={() => {
                const a = shownAspect(photo);
                patch(slot, { z: Math.min(ratio / a, a / ratio), x: 0, y: 0 });
              }}
            >
              Fit whole photo
            </Button>
            <Button variant="tonal" size="xs" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
          </div>
        </>
      ) : (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) void add(slot, file);
          }}
          className={cn(
            "grid min-h-36 cursor-pointer place-items-center gap-1 rounded-xl border-2 border-dashed p-6 text-center text-on-surface-variant transition-colors",
            "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-secondary",
            dragging
              ? "border-primary bg-primary/10"
              : "border-outline-variant hover:bg-on-surface/8",
          )}
        >
          <ImagePlus aria-hidden="true" className="size-8" />
          <span className="text-base font-medium text-on-surface">Tap or drop a photo</span>
          <span className="text-sm">JPG, PNG, WebP or HEIC{hint ? ` · ${hint}` : ""}</span>
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void add(slot, file);
          event.target.value = "";
        }}
      />
    </Section>
  );
}
