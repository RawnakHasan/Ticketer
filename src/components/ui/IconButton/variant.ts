import { cva } from "class-variance-authority";

export const iconButtonVariants = cva(
  [
    "group relative inline-flex shrink-0 cursor-pointer items-center justify-center select-none outline-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",

    // Springy shape and width change, plain color change
    "[transition:border-radius_350ms_cubic-bezier(0.34,1.56,0.64,1),width_350ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms,color_150ms]",
    "motion-reduce:transition-none",

    // Width comes from the width variant (--w), plus 15% per --k while a button group
    // has this button pressed (--k comes from the group and is 0 outside of one)
    "w-[calc(var(--w)*(1_+_0.15*var(--k,0)))]",

    // Corners squish while pressed
    "active:rounded-(--r-press)!",

    // State layer: 8% on hover, 10% on focus and press
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-current after:opacity-0 after:transition-opacity",
    "hover:after:opacity-[0.08] focus-visible:after:opacity-10 active:after:opacity-10",

    // Focus ring
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary",

    // Disabled
    "data-disabled:pointer-events-none data-disabled:text-on-surface/38!",
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
        outlined: [
          "border-(length:--outline-w) border-outline-variant text-on-surface-variant",
          "data-pressed:border-transparent data-pressed:bg-inverse-surface data-pressed:text-inverse-on-surface",
          "data-disabled:bg-transparent! data-disabled:data-pressed:bg-on-surface/12!",
        ],
        // No container, only the icon changes color
        standard: "text-on-surface-variant data-pressed:text-primary",
      },
      size: {
        xs: [
          "h-8 [--w-narrow:1.75rem] [--w-default:2rem] [--w-wide:2.5rem]",
          "[--r-round:1rem] [--r-square:0.75rem] [--r-press:0.5rem] [--outline-w:1px]",
          "[&_svg:not([class*='size-'])]:size-5",
          "before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-12 before:min-w-12 before:-translate-1/2", // 48px touch target
        ],
        sm: [
          "h-10 [--w-narrow:2rem] [--w-default:2.5rem] [--w-wide:3.25rem]",
          "[--r-round:1.25rem] [--r-square:0.75rem] [--r-press:0.5rem] [--outline-w:1px]",
          "[&_svg:not([class*='size-'])]:size-6",
          "before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-12 before:min-w-12 before:-translate-1/2",
        ],
        md: [
          "h-14 [--w-narrow:3rem] [--w-default:3.5rem] [--w-wide:4.5rem]",
          "[--r-round:1.75rem] [--r-square:1rem] [--r-press:0.75rem] [--outline-w:1px]",
          "[&_svg:not([class*='size-'])]:size-6",
        ],
        lg: [
          "h-24 [--w-narrow:4rem] [--w-default:6rem] [--w-wide:8rem]",
          "[--r-round:3rem] [--r-square:1.75rem] [--r-press:1rem] [--outline-w:2px]",
          "[&_svg:not([class*='size-'])]:size-8",
        ],
        xl: [
          "h-34 [--w-narrow:6.5rem] [--w-default:8.5rem] [--w-wide:11.5rem]",
          "[--r-round:4.25rem] [--r-square:1.75rem] [--r-press:1rem] [--outline-w:3px]",
          "[&_svg:not([class*='size-'])]:size-10",
        ],
      },
      width: {
        narrow: "[--w:var(--w-narrow)]",
        default: "[--w:var(--w-default)]",
        wide: "[--w:var(--w-wide)]",
      },
      // For toggles, the shape flips when pressed
      shape: {
        round: "rounded-(--r-round) data-pressed:rounded-(--r-square)",
        square: "rounded-(--r-square) data-pressed:rounded-(--r-round)",
      },
    },
    defaultVariants: {
      variant: "standard",
      size: "sm",
      width: "default",
      shape: "round",
    },
  },
);
