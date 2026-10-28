import type { ReactNode } from "react";

import { Divider } from "@/components/ui/Divider";
import { SegmentedButton, SegmentedButtonGroup } from "@/components/ui/SegmentedButton";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";

export function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="group/section">
      <Divider inset="middle" className="my-2 group-first/section:hidden" />
      <div className="flex flex-col gap-4 p-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-on-surface">{title}</h3>
            {action}
          </div>
          {hint && <p className="mt-1 text-sm text-on-surface-variant">{hint}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
};

export function SliderField({ label, value, min, max, step, format, onChange }: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-on-surface">{label}</span>
        <span className="text-on-surface-variant tabular-nums">
          {format ? format(value) : value}
        </span>
      </div>
      <Slider
        aria-label={label}
        size="s"
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(typeof next === "number" ? next : next[0])}
      />
    </div>
  );
}

export function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-on-surface">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

type SegmentedFieldProps<T extends string> = {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
};

export function SegmentedField<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedFieldProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <SegmentedButtonGroup
        aria-label={label}
        value={[value]}
        // Pressing the selected segment would empty the group, so that is ignored
        onValueChange={(next) => next[0] && onChange(next[0] as T)}
        className="w-full"
      >
        {options.map((option) => (
          <SegmentedButton key={option.value} value={option.value} showSelectedIcon={false}>
            {option.label}
          </SegmentedButton>
        ))}
      </SegmentedButtonGroup>
    </div>
  );
}
