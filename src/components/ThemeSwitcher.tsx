import { Popover } from "@base-ui/react/popover";
import { SunMoon } from "lucide-react";

import { PaletteMenu } from "@/components/PaletteMenu";
import { buttonVariants } from "@/components/ui/Button/variant";
import { SegmentedButton, SegmentedButtonGroup } from "@/components/ui/SegmentedButton";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const modes = [
  ["light", "Light"],
  ["dark", "Dark"],
  ["system", "System"],
] as const;

const contrasts = [
  ["standard", "Standard"],
  ["medium", "Medium"],
  ["high", "High"],
] as const;

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <SegmentedButtonGroup
      aria-label={`${label} selection`}
      className="max-[26rem]:[&_svg]:hidden max-[26rem]:**:data-[slot=segmented-button]:min-w-12"
      value={[value]}
      onValueChange={(values) => {
        const selected = options.find(([key]) => values.includes(key));
        if (selected) onChange(selected[0]);
      }}
      size="xs"
    >
      {options.map(([key, text]) => (
        <SegmentedButton key={key} value={key} showSelectedIcon={!compact}>
          {text}
        </SegmentedButton>
      ))}
    </SegmentedButtonGroup>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme, contrast, setContrast } = useTheme();

  const themeControl = (
    <Segmented label="Theme" options={modes} value={theme} onChange={setTheme} />
  );
  const contrastControl = (
    <Segmented label="Contrast" options={contrasts} value={contrast} onChange={setContrast} />
  );

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      {/* Wide screens: both groups sit in the header */}
      <div className="hidden items-center gap-3 min-[1700px]:flex">
        {themeControl}
        {contrastControl}
      </div>

      {/* Everywhere else: the same two groups in a popover */}
      <Popover.Root>
        <Popover.Trigger
          aria-label="Appearance"
          className={cn(
            buttonVariants({ variant: "tonal", size: "xs" }),
            "data-popup-open:bg-secondary data-popup-open:text-on-secondary min-[1700px]:hidden",
          )}
        >
          <SunMoon /> <span className="max-md:sr-only">Appearance</span>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
            <Popover.Popup
              className={cn(
                "max-w-[calc(100vw-2rem)] origin-(--transform-origin) space-y-4 rounded-[28px] bg-surface-container-high p-5 text-on-surface shadow-md outline-none",
                "transition-[opacity,scale] duration-150 motion-reduce:transition-none",
                "data-starting-style:scale-95 data-starting-style:opacity-0",
                "data-ending-style:scale-95 data-ending-style:opacity-0",
              )}
            >
              <Popover.Title className="text-xl text-on-surface">Appearance</Popover.Title>
              <div className="space-y-2">
                <p className="text-xs font-medium text-on-surface-variant">Theme</p>
                {themeControl}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-on-surface-variant">Contrast</p>
                {contrastControl}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      <PaletteMenu />
    </div>
  );
}
