import { cva } from "class-variance-authority";

export const cardVariants = cva(
  [
    // 12dp corners, content stacks vertically, children are clipped to the corners
    "relative flex min-w-0 flex-col overflow-hidden rounded-xl text-on-surface outline-none",
    "transition-[box-shadow,background-color,border-color] duration-150 motion-reduce:transition-none",

    // State layer: on-surface at 8% on hover, 10% on focus and press, 16% while dragged
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-on-surface after:opacity-0 after:transition-opacity",

    // Dragged: lifts and gets the strongest state layer (set by the dragged prop)
    "data-dragged:shadow-lg data-dragged:after:opacity-16",

    // Disabled: content drops to 38%, the container is set per variant
    "data-disabled:pointer-events-none data-disabled:*:opacity-38",
  ],
  {
    variants: {
      variant: {
        // Elevation 1, the card sits above the surface
        elevated: ["bg-surface-container-low shadow-sm", "data-disabled:bg-surface/38"],
        // Flat, separated from the surface by color only
        filled: ["bg-surface-container-highest", "data-disabled:bg-surface-variant/38"],
        // Flat, separated by a 1dp outline
        outlined: ["border border-outline-variant bg-surface", "data-disabled:border-outline/12"],
      },
      // Only for cards that are pressable as a whole
      interactive: {
        true: [
          "cursor-pointer select-none",
          "hover:after:opacity-[0.08] focus-visible:after:opacity-10 active:after:opacity-10",
          "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-secondary",
        ],
        false: "",
      },
    },
    compoundVariants: [
      // Elevated: hover raises to 2dp, focus and press settle back to 1dp
      {
        variant: "elevated",
        interactive: true,
        className: "hover:shadow-md focus-visible:shadow-sm active:shadow-sm",
      },
      // Filled and outlined: hover raises from 0 to 1dp
      {
        variant: ["filled", "outlined"],
        interactive: true,
        className: "hover:shadow-sm focus-visible:shadow-none active:shadow-none",
      },
    ],
    defaultVariants: {
      variant: "elevated",
      interactive: false,
    },
  },
);
