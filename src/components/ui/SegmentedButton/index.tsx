import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import {
  ToggleGroup as ToggleGroupPrimitive,
  type ToggleGroupState,
} from "@base-ui/react/toggle-group";
import { Check } from "lucide-react";
import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

type SegmentedButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

type SegmentedButtonGroupProps = Omit<ComponentProps<typeof ToggleGroupPrimitive>, "className"> & {
  className?: string;
  density?: 0 | -1 | -2 | -3;
  size?: SegmentedButtonSize;
};

type SegmentedGroupStyle = CSSProperties & Record<`--${string}`, string | number | undefined>;

function mergeGroupStyle(
  style: SegmentedButtonGroupProps["style"],
  variables: SegmentedGroupStyle,
): SegmentedButtonGroupProps["style"] {
  if (typeof style === "function") {
    return (state: ToggleGroupState) => ({ ...variables, ...style(state) });
  }

  return { ...variables, ...style };
}

function SegmentedButtonGroup({
  className,
  density = 0,
  multiple = false,
  size = "sm",
  style,
  ...props
}: SegmentedButtonGroupProps) {
  const metrics = {
    xs: { height: 32, padding: "0.75rem", fontSize: "0.875rem", gap: "0.5rem" },
    sm: { height: 40, padding: "1rem", fontSize: "0.875rem", gap: "0.5rem" },
    md: { height: 56, padding: "1.5rem", fontSize: "1rem", gap: "0.5rem" },
    lg: { height: 96, padding: "3rem", fontSize: "1.5rem", gap: "0.75rem" },
    xl: { height: 136, padding: "4rem", fontSize: "2rem", gap: "1rem" },
  };
  const metric = metrics[size];
  const groupStyle = mergeGroupStyle(style, {
    "--segment-height": `${metric.height + density * 4}px`,
    "--segment-padding": metric.padding,
    "--segment-font-size": metric.fontSize,
    "--segment-gap": metric.gap,
  });

  return (
    <ToggleGroupPrimitive
      multiple={multiple}
      style={groupStyle}
      className={cn(
        "inline-flex max-w-full items-stretch rounded-full border border-outline-variant bg-surface",
        "[&>*:not(:first-child)]:border-s [&>*:not(:first-child)]:border-outline-variant",
        "[&>*:first-child]:rounded-s-full [&>*:last-child]:rounded-e-full [&>*:only-child]:rounded-full",
        "[&>*:focus-visible]:z-10 [&>*:focus-visible]:outline-2 [&>*:focus-visible]:-outline-offset-2 [&>*:focus-visible]:outline-secondary",
        className,
      )}
      {...props}
    />
  );
}

type SegmentedButtonProps = Omit<ComponentProps<typeof TogglePrimitive>, "className"> & {
  className?: string;
  showSelectedIcon?: boolean;
};

function SegmentedButton({
  className,
  showSelectedIcon = true,
  children,
  ...props
}: SegmentedButtonProps) {
  return (
    <TogglePrimitive
      data-slot="segmented-button"
      className={cn(
        "relative inline-flex h-(--segment-height) min-w-12 flex-1 basis-0 cursor-pointer items-center justify-center gap-(--segment-gap) px-(--segment-padding) whitespace-nowrap text-on-surface [font-size:var(--segment-font-size)] font-medium select-none outline-none transition-[background-color,color] duration-150",
        "data-pressed:bg-secondary-container data-pressed:text-on-secondary-container",
        "hover:bg-surface-container-high focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-secondary",
        "data-disabled:pointer-events-none data-disabled:text-on-surface/38",
        showSelectedIcon && "group/segment min-w-26 gap-0 data-pressed:gap-(--segment-gap)",
        className,
      )}
      {...props}
    >
      {showSelectedIcon && (
        <Check
          aria-hidden="true"
          className="h-4 w-0 shrink-0 opacity-0 transition-[width,opacity] duration-200 group-data-pressed/segment:w-4 group-data-pressed/segment:opacity-100 motion-reduce:transition-none"
        />
      )}
      <span className="text-center">{children}</span>
    </TogglePrimitive>
  );
}

export { SegmentedButton, SegmentedButtonGroup };
