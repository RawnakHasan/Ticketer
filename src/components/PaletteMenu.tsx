import { Popover } from "@base-ui/react/popover";
import { ImagePlus, Palette, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/Button/variant";
import { seedsFromImage } from "@/lib/palette/generate";
import { hexColor, paletteVariants, variantLabels } from "@/lib/palette/schema";
import { cn } from "@/lib/utils";
import { usePaletteStore } from "@/stores/paletteStore";

const DEFAULT_SEED = "#266489"; // primary of the static light.css

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      {children}
    </div>
  );
}

function Swatch({
  hex,
  selected,
  onSelect,
}: {
  hex: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Use ${hex}`}
      aria-pressed={selected}
      onClick={onSelect}
      style={{ background: hex }}
      className="size-9 cursor-pointer rounded-full border border-outline-variant outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary aria-pressed:outline-2 aria-pressed:outline-offset-2 aria-pressed:outline-primary"
    />
  );
}

export function PaletteMenu() {
  const seed = usePaletteStore((s) => s.seed);
  const variant = usePaletteStore((s) => s.variant);
  const setSeed = usePaletteStore((s) => s.setSeed);
  const setVariant = usePaletteStore((s) => s.setVariant);
  const reset = usePaletteStore((s) => s.reset);

  // Kept here (not in the popup) so they survive closing the popover
  const [candidates, setCandidates] = useState<string[]>([]);
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState<string>();
  const [draft, setDraft] = useState<string | null>(null); // hex being typed
  const previewRef = useRef<string | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  const current = seed ?? DEFAULT_SEED;
  const shownHex = draft ?? current;
  const hexValid = hexColor.safeParse(shownHex).success;

  async function onFile(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    try {
      setError(undefined);
      const found = await seedsFromImage(file);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = url;
      setPreview(url);
      setCandidates(found);
      if (found[0]) setSeed(found[0]);
    } catch {
      URL.revokeObjectURL(url);
      setError("Couldn't read that image.");
    }
  }

  function onReset() {
    reset();
    setCandidates([]);
    setDraft(null);
    setError(undefined);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = undefined;
    setPreview(undefined);
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          buttonVariants({ variant: "tonal", size: "xs" }),
          "data-popup-open:bg-secondary data-popup-open:text-on-secondary",
        )}
      >
        <Palette /> Palette
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Popover.Popup
            className={cn(
              "w-80 max-w-[calc(100vw-2rem)] origin-(--transform-origin) space-y-5 rounded-[28px] bg-surface-container-high p-5 text-on-surface shadow-md outline-none",
              "transition-[opacity,scale] duration-150 motion-reduce:transition-none",
              "data-starting-style:scale-95 data-starting-style:opacity-0",
              "data-ending-style:scale-95 data-ending-style:opacity-0",
            )}
          >
            <div className="flex items-center justify-between">
              <Popover.Title className="text-xl text-on-surface">Palette</Popover.Title>
              <Button variant="text" size="xs" disabled={!seed} onClick={onReset}>
                <RotateCcw /> Reset
              </Button>
            </div>

            <Field label="Seed color">
              <div className="flex items-center gap-3">
                {/* The native color input is invisible and fills the round swatch */}
                <label
                  className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-full border border-outline-variant focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-secondary"
                  style={{ background: current }}
                >
                  <input
                    type="color"
                    aria-label="Pick seed color"
                    value={current}
                    onChange={(e) => {
                      setDraft(null);
                      setSeed(e.target.value);
                    }}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </label>
                <input
                  aria-label="Seed color hex"
                  aria-invalid={!hexValid}
                  value={shownHex}
                  maxLength={7}
                  spellCheck={false}
                  onChange={(e) => {
                    let v = e.target.value.trim();
                    if (!v.startsWith("#")) v = `#${v}`;
                    setDraft(v);
                    if (hexColor.safeParse(v).success) setSeed(v);
                  }}
                  onBlur={() => setDraft(null)}
                  className="h-10 w-full rounded-full border border-outline bg-transparent px-4 font-mono text-sm text-on-surface outline-none focus:border-primary aria-invalid:border-error"
                />
              </div>
            </Field>

            <Field label="From image">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  void onFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <div className="flex items-center gap-3">
                {preview && (
                  <img
                    src={preview}
                    alt="Selected image"
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                )}
                <Button variant="outlined" size="xs" onClick={() => fileRef.current?.click()}>
                  <ImagePlus /> {preview ? "Change image" : "Pick image"}
                </Button>
              </div>
              {candidates.length > 0 && (
                <div className="flex gap-2 pt-1" role="group" aria-label="Colors from image">
                  {candidates.map((hex) => (
                    <Swatch
                      key={hex}
                      hex={hex}
                      selected={hex === seed}
                      onSelect={() => setSeed(hex)}
                    />
                  ))}
                </div>
              )}
              {error && (
                <p role="alert" className="text-sm text-error">
                  {error}
                </p>
              )}
            </Field>

            <Field label="Style">
              <div role="radiogroup" aria-label="Palette style" className="grid grid-cols-3 gap-2">
                {paletteVariants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={v === variant}
                    onClick={() => setVariant(v)}
                    className="h-8 min-w-0 cursor-pointer truncate rounded-full border border-outline-variant px-2 text-xs font-medium text-on-surface-variant outline-none transition-colors hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-secondary aria-checked:border-transparent aria-checked:bg-secondary-container aria-checked:text-on-secondary-container"
                  >
                    {variantLabels[v]}
                  </button>
                ))}
              </div>
            </Field>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
