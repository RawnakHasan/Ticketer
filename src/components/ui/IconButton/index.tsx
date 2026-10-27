import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { iconButtonVariants } from "@/components/ui/IconButton/variant";
import { useButtonGroup } from "@/hooks/useButtonGroup";

type IconButtonVariants = VariantProps<typeof iconButtonVariants>;

// Icon-only buttons have no visible text, so a label is required
type IconButtonBaseProps = IconButtonVariants & {
  "aria-label": string;
  className?: string;
};

type IconButtonProps = Omit<ButtonPrimitive.Props, "className"> & IconButtonBaseProps;

function IconButton({ className, variant, size, width, shape, ...props }: IconButtonProps) {
  // Inside a button group, size and shape default to the group's
  const group = useButtonGroup();

  return (
    <ButtonPrimitive
      data-slot="icon-button"
      className={cn(
        iconButtonVariants({
          variant,
          size: size ?? group?.size,
          width,
          shape: shape ?? group?.shape,
        }),
        className,
      )}
      {...props}
    />
  );
}

type ToggleIconButtonProps = Omit<TogglePrimitive.Props, "className"> & IconButtonBaseProps;

function ToggleIconButton({
  className,
  variant,
  size,
  width,
  shape,
  ...props
}: ToggleIconButtonProps) {
  const group = useButtonGroup();

  return (
    <TogglePrimitive
      data-slot="toggle-icon-button"
      className={cn(
        iconButtonVariants({
          variant,
          size: size ?? group?.size,
          width,
          shape: shape ?? group?.shape,
        }),
        className,
      )}
      {...props}
    />
  );
}

export { IconButton, ToggleIconButton };
