import { useTheme } from "@/hooks/useTheme";
import { SegmentedButton, SegmentedButtonGroup } from "@/components/ui/SegmentedButton";
import { PaletteMenu } from "@/components/PaletteMenu";

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
}: {
  label: string;
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <SegmentedButtonGroup
      aria-label={`${label} selection`}
      value={[value]}
      onValueChange={(values) => {
        const selected = options.find(([key]) => values.includes(key));
        if (selected) onChange(selected[0]);
      }}
      size="xs"
    >
      {options.map(([key, text]) => (
        <SegmentedButton key={key} value={key}>
          {text}
        </SegmentedButton>
      ))}
    </SegmentedButtonGroup>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme, contrast, setContrast } = useTheme();

  return (
    <div className="flex shrink-0 items-center gap-3">
      <Segmented label="Theme" options={modes} value={theme} onChange={setTheme} />
      <Segmented label="Contrast" options={contrasts} value={contrast} onChange={setContrast} />
      <PaletteMenu />
    </div>
  );
}
