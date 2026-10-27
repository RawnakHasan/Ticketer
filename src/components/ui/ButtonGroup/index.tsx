import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { buttonGroupVariants } from "@/components/ui/ButtonGroup/variant";
import {
  ButtonGroupContext,
  type ButtonGroupShape,
  type ButtonGroupSize,
} from "@/contexts/ButtonGroupContext";

type ButtonGroupOwnProps = {
  // Standard keeps each button's shape, connected joins them into one pill
  type?: "standard" | "connected";
  // Buttons inside the group inherit these unless they set their own
  size?: ButtonGroupSize;
  shape?: ButtonGroupShape;
  // Wrap onto the next line instead of overflowing (use with the standard type)
  wrap?: boolean;
  className?: string;
};

type ButtonGroupProps = Omit<ComponentProps<"div">, "className"> & ButtonGroupOwnProps;

// Layout only: the buttons themselves decide what they do
function ButtonGroup({
  className,
  type = "standard",
  size = "sm",
  shape,
  wrap,
  ...props
}: ButtonGroupProps) {
  return (
    <ButtonGroupContext.Provider value={{ size, shape }}>
      <div
        role="group"
        data-slot="button-group"
        className={cn(buttonGroupVariants({ type, size, wrap }), className)}
        {...props}
      />
    </ButtonGroupContext.Provider>
  );
}

// Selection built on Base UI's ToggleGroup. Give every child a `value`.
// Connected is the default since it replaces the segmented button.
type ToggleButtonGroupProps = Omit<ToggleGroupPrimitive.Props, "className"> & ButtonGroupOwnProps;

function ToggleButtonGroup({
  className,
  type = "connected",
  size = "sm",
  shape,
  wrap,
  ...props
}: ToggleButtonGroupProps) {
  return (
    <ButtonGroupContext.Provider value={{ size, shape }}>
      <ToggleGroupPrimitive
        data-slot="toggle-button-group"
        className={cn(buttonGroupVariants({ type, size, wrap }), className)}
        {...props}
      />
    </ButtonGroupContext.Provider>
  );
}

export { ButtonGroup, ToggleButtonGroup };
