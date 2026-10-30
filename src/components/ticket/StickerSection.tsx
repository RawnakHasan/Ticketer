import { Copy, Eraser, FlipHorizontal2, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { MaterialShape } from "@/components/MaterialShape";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/Button/variant";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { PhotoCrop } from "@/components/ticket/PhotoCrop";
import { Section, SliderField, SwitchField } from "@/components/ticket/controls";
import { materialShapeNames } from "@/lib/shapes/materialShapes";
import { autoInk, hexToRgb, rgb, rgbToHex, type RGB } from "@/lib/ticket/color";
import { photoChips } from "@/lib/ticket/palette";
import { buildTicketState } from "@/lib/ticket/render/state";
import { MAX_STICKERS, getSprite, type Sticker, type StickerSide } from "@/lib/ticket/sticker";
import { STICKER_ART, artSvg } from "@/lib/ticket/stickerArt";
import { cutOutBackground } from "@/lib/ticket/stickerImage";
import { loadPhoto } from "@/lib/ticket/photo";
import { cn } from "@/lib/utils";
import { usePhotoStore } from "@/stores/photoStore";
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

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const SIDES: { id: StickerSide; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
  { id: "both", label: "Both" },
];

// Cuts the background out of a photo sticker, on this device. The first time it downloads a
// model (about 40 MB), which the browser keeps for later.
function RemoveBackground({ sticker }: { sticker: Sticker }) {
  const replacePhoto = useStickerStore((s) => s.replacePhoto);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setError("");
    setProgress(0);
    try {
      const file = await cutOutBackground(sticker.photo.src, setProgress);
      // A cutout is always shown whole, so the crop that was set no longer applies
      replacePhoto(sticker.id, await loadPhoto(file), { shape: "cutout", hasAlpha: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The background could not be removed.");
    } finally {
      setProgress(null);
    }
  }

  const busy = progress !== null;
  return (
    <div className="flex flex-col gap-2">
      <div>
        <Button variant="tonal" size="xs" disabled={busy} onClick={run}>
          <Eraser aria-hidden="true" />
          {busy ? `Removing background… ${Math.round(progress * 100)}%` : "Remove background"}
        </Button>
      </div>
      <p className="text-sm text-on-surface-variant">
        Runs on your device, nothing is uploaded. The first time it downloads a model of about 40
        MB.
      </p>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
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
  const settings = useTicketerStore((s) => s.settings);
  const layout = settings.layout;
  const main = usePhotoStore((s) => s.main);
  const stub = usePhotoStore((s) => s.stub);
  const { addArt, recolor } = useStickerStore.getState();

  // New pack stickers start in the ticket's accent colour
  const { st } = buildTicketState(settings, { main, stub });
  const accentHex = rgbToHex(st.acc);
  const packUrls = useMemo(
    () =>
      STICKER_ART.map((art) => ({
        art,
        url: svgUrl(artSvg(art, rgb(hexToRgb(accentHex)), rgb(autoInk(hexToRgb(accentHex))), 64)),
      })),
    [accentHex],
  );

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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-on-surface">Sticker pack</span>
        <div
          role="group"
          aria-label="Sticker pack"
          className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1"
        >
          {packUrls.map(({ art, url }) => (
            <button
              key={art.id}
              type="button"
              aria-label={`Add ${art.label}`}
              title={art.label}
              disabled={full}
              onClick={() => void addArt(art.id, st.acc)}
              className={cn(CHOICE, "aspect-square p-1.5 disabled:opacity-40")}
            >
              <img src={url} alt="" className="size-full" draggable={false} />
            </button>
          ))}
        </div>
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
          {!selected.art && (
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
          )}

          {!selected.art && selected.shape !== "cutout" && (
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

          {selected.art ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-on-surface">Colour</span>
              <div
                role="group"
                aria-label="Sticker colour"
                className="flex flex-wrap items-center gap-1.5"
              >
                {packColours(
                  st.acc,
                  st.ink,
                  st.paper,
                  st.ink2,
                  photoChips("accent", main, stub),
                ).map((colour) => {
                  const hex = rgbToHex(colour);
                  const picked = hex === rgbToHex(selected.art!.color);
                  return (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Colour ${hex.toUpperCase()}`}
                      aria-pressed={picked}
                      title={hex.toUpperCase()}
                      onClick={() => void recolor(selected.id, colour)}
                      style={{ backgroundColor: rgb(colour) }}
                      className={cn(
                        "size-7 rounded-full ring-1 ring-inset ring-on-surface/20 outline-none transition-transform hover:scale-110 active:scale-95",
                        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary",
                        picked &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-low",
                      )}
                    />
                  );
                })}
                <ColorPicker
                  label="Custom sticker colour"
                  value={rgbToHex(selected.art.color)}
                  onChange={(hex) => void recolor(selected.id, hexToRgb(hex))}
                  className="grid size-7 place-items-center rounded-full bg-surface-container-highest text-xs font-medium text-on-surface ring-1 ring-inset ring-on-surface/20"
                >
                  +
                </ColorPicker>
              </div>
            </div>
          ) : (
            !selected.hasAlpha && <RemoveBackground key={selected.id} sticker={selected} />
          )}

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-on-surface">Show on</span>
            <div role="group" aria-label="Sticker side" className="flex gap-1">
              {SIDES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected.side === id}
                  onClick={() => patch(selected.id, { side: id })}
                  className={cn(CHOICE, "h-11 px-4 text-sm font-medium")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

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
            ? "Switch to the back of the ticket to place stickers there."
            : "Dragging works with the One ticket layout. Stickers show on every ticket in the group."}
        </p>
      )}
    </Section>
  );
}

// Colours offered for a pack sticker: the ticket's own, then ones from the photos, then plain
// white and black. Colours that are almost the same are left out.
function packColours(acc: RGB, ink: RGB, paper: RGB, ink2: RGB | null, fromPhotos: RGB[]): RGB[] {
  const out: RGB[] = [];
  for (const colour of [
    acc,
    ink,
    paper,
    ...(ink2 ? [ink2] : []),
    ...fromPhotos,
    [255, 255, 255],
    [20, 20, 20],
  ] as RGB[]) {
    if (out.every((o) => o.some((v, i) => Math.abs(v - colour[i]) > 12))) out.push(colour);
  }
  return out.slice(0, 10);
}
