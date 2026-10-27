import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  [
    "relative inline-flex min-w-12 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none outline-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",

    // Springy shape and width change, plain color change
    "[transition:border-radius_350ms_cubic-bezier(0.34,1.56,0.64,1),padding-inline_350ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms,color_150ms,box-shadow_150ms]",
    "motion-reduce:transition-none",

    // Horizontal padding, plus whatever a button group asks for while a button in it is pressed
    // (--g-grow and --k come from the group, both are 0 outside of one)
    "px-[calc(var(--px)_+_var(--g-grow,0px)*var(--k,0)/2)]",

    // Corners squish while pressed
    "active:rounded-(--r-press)!",

    // State layer: 8% on hover, 10% on focus and press
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-current after:opacity-0 after:transition-opacity",
    "hover:after:opacity-[0.08] focus-visible:after:opacity-10 active:after:opacity-10",

    // Focus ring
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary",

    // Disabled
    "data-disabled:pointer-events-none data-disabled:text-on-surface/38! data-disabled:shadow-none",
  ],
  {
    variants: {
      variant: {
        filled: [
          "bg-primary text-on-primary",
          "aria-[pressed=false]:bg-surface-container aria-[pressed=false]:text-on-surface-variant",
          "data-pressed:bg-primary data-pressed:text-on-primary",
          "data-disabled:bg-on-surface/12!",
        ],
        tonal: [
          "bg-secondary-container text-on-secondary-container",
          "data-pressed:bg-secondary data-pressed:text-on-secondary",
          "data-disabled:bg-on-surface/12!",
        ],
        elevated: [
          "bg-surface-container-low text-primary shadow-sm hover:shadow-md",
          "data-pressed:bg-primary data-pressed:text-on-primary",
          "data-disabled:bg-on-surface/12!",
        ],
        outlined: [
          "border-(length:--outline-w) border-outline-variant text-on-surface-variant",
          "data-pressed:border-transparent data-pressed:bg-inverse-surface data-pressed:text-inverse-on-surface",
          "data-disabled:bg-transparent! data-disabled:data-pressed:bg-on-surface/12!",
        ],
        text: "text-primary",
      },
      size: {
        xs: [
          "h-8 gap-2 [--px:0.75rem] text-sm font-medium tracking-[0.007em]",
          "[--r-round:1rem] [--r-square:0.75rem] [--r-press:0.5rem] [--outline-w:1px]",
          "[&_svg:not([class*='size-'])]:size-5",
          "before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-12 before:min-w-12 before:-translate-1/2", // 48px touch target
        ],
        sm: [
          "h-10 gap-2 [--px:1rem] text-sm font-medium tracking-[0.007em]",
          "[--r-round:1.25rem] [--r-square:0.75rem] [--r-press:0.5rem] [--outline-w:1px]",
          "[&_svg:not([class*='size-'])]:size-5",
          "before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-12 before:min-w-12 before:-translate-1/2",
        ],
        md: [
          "h-14 gap-2 [--px:1.5rem] text-base font-medium tracking-[0.009em]",
          "[--r-round:1.75rem] [--r-square:1rem] [--r-press:0.75rem] [--outline-w:1px]",
          "[&_svg:not([class*='size-'])]:size-6",
        ],
        lg: [
          "h-24 gap-3 [--px:3rem] text-2xl",
          "[--r-round:3rem] [--r-square:1.75rem] [--r-press:1rem] [--outline-w:2px]",
          "[&_svg:not([class*='size-'])]:size-8",
        ],
        xl: [
          "h-34 gap-4 [--px:4rem] text-[2rem] leading-10",
          "[--r-round:4.25rem] [--r-square:1.75rem] [--r-press:1rem] [--outline-w:3px]",
          "[&_svg:not([class*='size-'])]:size-10",
        ],
      },
      // For toggles, the shape flips when pressed
      shape: {
        round: "rounded-(--r-round) data-pressed:rounded-(--r-square)",
        square: "rounded-(--r-square) data-pressed:rounded-(--r-round)",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "sm",
      shape: "round",
    },
  },
);
