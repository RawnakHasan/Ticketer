import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import type { SwitchRootProps } from "@base-ui/react/switch";
import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { switchThumbVariants, switchVariants } from "@/components/ui/Switch/variant";

type SwitchVariants = VariantProps<typeof switchThumbVariants>;

type SwitchProps = Omit<SwitchRootProps, "className"> &
  SwitchVariants & {
    checkedIcon?: ReactNode;
    uncheckedIcon?: ReactNode;
    className?: string;
    thumbClassName?: string;
  };

function Switch({
  checkedIcon,
  uncheckedIcon,
  className,
  thumbClassName,
  iconMode,
  ...props
}: SwitchProps) {
  const resolvedIconMode = iconMode ?? (uncheckedIcon ? "both" : checkedIcon ? "checked" : "none");

  return (
    <SwitchPrimitive.Root data-slot="switch" className={cn(switchVariants(), className)} {...props}>
      <SwitchPrimitive.Thumb
        className={cn(switchThumbVariants({ iconMode: resolvedIconMode }), thumbClassName)}
      >
        {uncheckedIcon && (
          <span className="pointer-events-none flex size-4 items-center justify-center text-on-surface-variant group-data-checked:hidden [&_svg]:size-4">
            {uncheckedIcon}
          </span>
        )}
        {checkedIcon && (
          <span className="pointer-events-none hidden size-4 items-center justify-center text-primary group-data-checked:flex [&_svg]:size-4">
            {checkedIcon}
          </span>
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
