import { cva } from "class-variance-authority";

// Children are matched by [data-slot] (button, icon-button and the toggle versions all set it).
// Only direct children are styled, so don't wrap them in extra elements.
export const buttonGroupVariants = cva(
  [
    "inline-flex max-w-full items-center",

    // Keep the focus ring of the focused child above its neighbors
    "[&>[data-slot]:focus-visible]:z-10",
  ],
  {
    variants: {
      type: {
        // Children keep their own shape. The pressed child grows and its neighbors give way,
        // so the group's total width stays the same.
        // --k: 1 on the pressed child, negative on the neighbors (children read it, see Button and IconButton)
        standard: [
          "gap-(--g-gap)",
          "[&>[data-slot]:active]:[--k:1]",
          "[&>[data-slot]:has(+[data-slot]:active)]:[--k:-0.5]",
          "[&>[data-slot]:active+[data-slot]]:[--k:-0.5]",
          // At the edges there is only one neighbor to give way, so it gives all of it
          "[&>[data-slot]:has(+[data-slot]:last-child:active)]:[--k:-1]",
          "[&>[data-slot]:first-child:active+[data-slot]]:[--k:-1]",
        ],

        // Children share one pill. Outer corners stay fully round, inner corners depend on state:
        // small at rest, smaller while pressed, fully round once toggled on.
        connected: [
          "gap-0.5",
          "[&>[data-slot]]:[--ci:var(--g-inner)]",
          "[&>[data-slot]:active]:[--ci:var(--g-inner-press)]",
          "[&>[data-slot][data-pressed]:not(:active)]:[--ci:var(--r-round)]",

          // Important is needed to beat the buttons' own press and toggle radius
          "[&>[data-slot]:only-child]:rounded-(--r-round)!",
          "[&>[data-slot]:first-child:not(:only-child)]:rounded-s-(--r-round)!",
          "[&>[data-slot]:first-child:not(:only-child)]:rounded-e-(--ci)!",
          "[&>[data-slot]:last-child:not(:only-child)]:rounded-e-(--r-round)!",
          "[&>[data-slot]:last-child:not(:only-child)]:rounded-s-(--ci)!",
          "[&>[data-slot]:not(:first-child):not(:last-child)]:rounded-(--ci)!",
        ],
      },
      size: {
        // Values for sm come from the M3 Android tokens: 12dp gap standard, 2dp gap connected,
        // 8dp inner corners at rest and 4dp pressed. The other sizes are scaled from the M3 spec,
        // double-check the lg and xl corner values against it.
        // --g-grow: how much wider a pressed auto-width button gets (M3 says 15%)
        xs: [
          "[--g-gap:1.125rem] [--g-grow:0.5rem]",
          "[--g-inner:0.5rem] [--g-inner-press:0.25rem]",
        ],
        sm: [
          "[--g-gap:0.75rem] [--g-grow:0.75rem]",
          "[--g-inner:0.5rem] [--g-inner-press:0.25rem]",
        ],
        md: ["[--g-gap:0.5rem] [--g-grow:1rem]", "[--g-inner:0.5rem] [--g-inner-press:0.25rem]"],
        lg: ["[--g-gap:0.5rem] [--g-grow:1.5rem]", "[--g-inner:1rem] [--g-inner-press:0.5rem]"],
        xl: ["[--g-gap:0.5rem] [--g-grow:2rem]", "[--g-inner:1.25rem] [--g-inner-press:0.75rem]"],
      },
      wrap: {
        true: "flex-wrap",
        false: "flex-nowrap",
      },
    },
    defaultVariants: {
      type: "standard",
      size: "sm",
      wrap: false,
    },
  },
);
