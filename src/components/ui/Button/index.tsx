import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/Button/variant";
import { useButtonGroup } from "@/hooks/useButtonGroup";

type ButtonVariants = VariantProps<typeof buttonVariants>;

type ButtonProps = Omit<ButtonPrimitive.Props, "className"> &
  ButtonVariants & {
    className?: string;
  };

function Button({ className, variant, size, shape, ...props }: ButtonProps) {
  const group = useButtonGroup();

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size: size ?? group?.size, shape: shape ?? group?.shape }),
        className,
      )}
      {...props}
    />
  );
}

// M3 text buttons can't be toggled
type ToggleButtonProps = Omit<TogglePrimitive.Props, "className"> &
  Omit<ButtonVariants, "variant"> & {
    variant?: Exclude<ButtonVariants["variant"], "text">;
    className?: string;
  };

function ToggleButton({ className, variant, size, shape, ...props }: ToggleButtonProps) {
  const group = useButtonGroup();

  return (
    <TogglePrimitive
      data-slot="toggle-button"
      className={cn(
        buttonVariants({ variant, size: size ?? group?.size, shape: shape ?? group?.shape }),
        className,
      )}
      {...props}
    />
  );
}

export { Button, ToggleButton };
