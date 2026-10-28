import { useId } from "react";
import { Pipette, Sparkles, TriangleAlert } from "lucide-react";

import { ToggleButton } from "@/components/ui/Button";
import { rgb, rgbToHex, hexToRgb, type RGB } from "@/lib/ticket/color";
import { cn } from "@/lib/utils";
import { ColorPicker } from "@/components/ui/ColorPicker";

type ColorRowProps = {
  label: string;
  value: RGB;
  manual: boolean;
  onChange: (value: RGB) => void;
  onAuto: () => void;
  tile: { fill: RGB; text: RGB };
  contrast?: number;
};

const SWATCH_MOTION =
  "[transition:border-radius_350ms_cubic-bezier(0.34,1.56,0.64,1),scale_150ms,background-color_150ms,color_150ms,outline-color_150ms] motion-reduce:transition-none";

export function ColorRow({
  label,
  value,
  manual,
  onChange,
  onAuto,
  tile,
  contrast,
}: ColorRowProps) {
  const id = useId();
  const low = manual && contrast !== undefined && contrast < 4.5;

  return (
    // Rows sit in a segmented list: big outer corners, small ones where rows meet
    <div className="flex flex-col gap-2 rounded-md bg-surface-container-low p-2 pr-3 first:rounded-t-[1.25rem] last:rounded-b-[1.25rem]">
      <div className="flex items-center gap-3">
        {/* The whole tile opens the picker. 1.125rem = squircle, 1.75rem = half of the 3.5rem tile = circle */}
        <ColorPicker
          id={id}
          label={label}
          value={rgbToHex(value)}
          onChange={(hex) => onChange(hexToRgb(hex))}
          className="group/swatch relative size-14 shrink-0 cursor-pointer outline-none"
        >
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 grid place-items-center overflow-hidden rounded-[1.125rem] ring-1 ring-inset ring-on-surface/15",
              "group-hover/swatch:rounded-[1.75rem] group-focus-visible/swatch:rounded-[1.75rem] group-data-popup-open/swatch:rounded-[1.75rem] group-active/swatch:scale-95",
              "group-focus-visible/swatch:outline-3 group-focus-visible/swatch:outline-offset-2 group-focus-visible/swatch:outline-secondary",
              SWATCH_MOTION,
            )}
            style={{ backgroundColor: rgb(tile.fill), color: rgb(tile.text) }}
          >
            <span className="font-display text-2xl leading-none font-semibold">Aa</span>
          </span>

          <span
            aria-hidden
            className="pointer-events-none absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-surface-container-highest text-on-surface ring-2 ring-surface-container-low"
          >
            <Pipette className="size-3.5" />
          </span>
        </ColorPicker>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label
            htmlFor={id}
            className="cursor-pointer truncate text-sm font-medium text-on-surface"
          >
            {label}
          </label>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-[DM_Mono,ui-monospace,monospace] text-xs tracking-wide text-on-surface-variant">
              {rgbToHex(value).toUpperCase()}
            </span>
            {contrast !== undefined && (
              <span
                title="Contrast against the paper"
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.6875rem] leading-4 font-medium tabular-nums",
                  low
                    ? "bg-error-container text-on-error-container"
                    : "bg-surface-container-highest text-on-surface-variant",
                )}
              >
                {contrast.toFixed(1)}:1
              </span>
            )}
          </span>
        </div>

        {/* On = the colour follows your photo and paper. Off = it's locked to what you picked. */}
        <ToggleButton
          variant="tonal"
          size="xs"
          className="min-w-22"
          pressed={!manual}
          onPressedChange={(on) => (on ? onAuto() : onChange(value))}
          aria-label={`Automatic ${label.toLowerCase()}`}
          title={
            manual ? "Go back to the automatic colour" : "Lock this colour so it stops changing"
          }
        >
          <Sparkles className="size-4" />
          Auto
        </ToggleButton>
      </div>

      {low && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl bg-error-container px-3 py-2 text-sm text-on-error-container"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          Low contrast against this paper. Text may be hard to read.
        </p>
      )}
    </div>
  );
}
