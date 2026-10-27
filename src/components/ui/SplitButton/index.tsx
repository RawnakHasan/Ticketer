import { Menu } from "@base-ui/react/menu";
import type { VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";
import type { ComponentProps, MouseEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/Button/variant";
import { splitButtonVariants } from "@/components/ui/SplitButton/variant";

type ButtonVariants = VariantProps<typeof buttonVariants>;

// M3 split buttons have no text variant
type SplitButtonVariant = Exclude<NonNullable<ButtonVariants["variant"]>, "text">;
type SplitButtonSize = NonNullable<VariantProps<typeof splitButtonVariants>["size"]>;

// Same colors the toggle buttons use when pressed, applied while the menu is open
const openStyles: Record<SplitButtonVariant, string> = {
  filled: "",
  tonal: "data-popup-open:bg-secondary data-popup-open:text-on-secondary",
  elevated: "data-popup-open:bg-primary data-popup-open:text-on-primary",
  outlined:
    "data-popup-open:border-transparent data-popup-open:bg-inverse-surface data-popup-open:text-inverse-on-surface",
};

type SplitButtonProps = Omit<ComponentProps<"div">, "className" | "children" | "onClick"> & {
  variant?: SplitButtonVariant;
  size?: SplitButtonSize;
  className?: string;
  // Content of the leading button (icon and/or label)
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  // The trailing button has no visible text, so a label is required
  menuLabel: string;
  // Put SplitButtonItem elements here
  menu: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function SplitButton({
  variant = "filled",
  size = "sm",
  className,
  children,
  onClick,
  disabled,
  menuLabel,
  menu,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: SplitButtonProps) {
  return (
    <div
      role="group"
      data-slot="split-button"
      className={cn(splitButtonVariants({ size }), className)}
      {...props}
    >
      {/* Leading: the main action */}
      <Button variant={variant} size={size} disabled={disabled} onClick={onClick}>
        {children}
      </Button>

      {/* Trailing: opens the menu */}
      <Menu.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <Menu.Trigger
          data-slot="split-button-trigger"
          aria-label={menuLabel}
          disabled={disabled}
          className={cn(
            buttonVariants({ variant, size }),
            "group min-w-0 px-0 w-(--t-w) data-popup-open:w-(--t-w-open)",
            // Same springy transition as the buttons, plus width
            "[transition:border-radius_350ms_cubic-bezier(0.34,1.56,0.64,1),width_350ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms,color_150ms,box-shadow_150ms]",
            openStyles[variant],
          )}
        >
          <ChevronDown className="size-(--t-icon) transition-transform duration-300 group-data-popup-open:rotate-180 motion-reduce:transition-none" />
        </Menu.Trigger>

        <Menu.Portal>
          {/* Aligned to the trailing edge of the arrow button */}
          <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
            <Menu.Popup
              className={cn(
                "min-w-28 origin-(--transform-origin) rounded-xl bg-surface-container-low py-2 text-on-surface shadow-md outline-none",
                "transition-[opacity,scale] duration-150 motion-reduce:transition-none",
                "data-starting-style:scale-95 data-starting-style:opacity-0",
                "data-ending-style:scale-95 data-ending-style:opacity-0",
              )}
            >
              {menu}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}

type SplitButtonItemProps = Omit<Menu.Item.Props, "className"> & { className?: string };

function SplitButtonItem({ className, ...props }: SplitButtonItemProps) {
  return (
    <Menu.Item
      data-slot="split-button-item"
      className={cn(
        "flex h-12 cursor-pointer items-center gap-3 px-3 text-base text-on-surface outline-none select-none",
        "data-highlighted:bg-on-surface/8",
        "data-disabled:pointer-events-none data-disabled:text-on-surface/38",
        "[&_svg]:size-6 [&_svg]:shrink-0 [&_svg]:text-on-surface-variant",
        className,
      )}
      {...props}
    />
  );
}

export { SplitButton, SplitButtonItem };
