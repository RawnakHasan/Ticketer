import { cva } from "class-variance-authority";

// Layout and corner logic for the two segments (leading action + trailing menu trigger).
// Children are matched by [data-slot]; the leading one is first-child, the trailing one last-child.
// Colors, height and text come from buttonVariants, this file only adds what is split-specific.
export const splitButtonVariants = cva(
  [
    // M3: fixed 2dp gap between the segments
    "inline-flex max-w-full items-center gap-0.5",

    // Keep the focus ring of the focused segment above its neighbor
    "[&>[data-slot]:focus-visible]:z-10",

    // Inner corner (--ci): small at rest, smaller while pressed, fully round while the menu is open
    "[&>[data-slot]]:[--ci:var(--s-inner)]",
    "[&>[data-slot]:active]:[--ci:var(--s-inner-press)]",
    "[&>[data-slot][data-popup-open]:not(:active)]:[--ci:var(--r-round)]",

    // Outer corners stay fully round, inner corners use --ci.
    // Important is needed to beat the buttons' own press radius.
    "[&>[data-slot]:first-child]:rounded-s-(--r-round)!",
    "[&>[data-slot]:first-child]:rounded-e-(--ci)!",
    "[&>[data-slot]:last-child]:rounded-e-(--r-round)!",
    "[&>[data-slot]:last-child]:rounded-s-(--ci)!",

    // The leading button's right padding is smaller than its left one
    "[&>[data-slot]:first-child]:pe-(--lead-pe)",
  ],
  {
    variants: {
      size: {
        // --s-inner / --s-inner-press: inner corner at rest / pressed
        // --lead-pe: leading button's end padding
        // --t-w / --t-w-open: trailing segment width closed / open (open is a circle from md up)
        // --t-icon: chevron size
        // Rest values come from the M3 Expressive measurements (inner corners 4/4/4/8/12dp).
        // The pressed inner corners are scaled by me (half of rest), check them against the spec.
        xs: [
          "[--s-inner:0.25rem] [--s-inner-press:0.125rem]",
          "[--lead-pe:0.625rem] [--t-w:2.875rem] [--t-w-open:3rem] [--t-icon:1.25rem]",
        ],
        sm: [
          "[--s-inner:0.25rem] [--s-inner-press:0.125rem]",
          "[--lead-pe:0.75rem] [--t-w:2.875rem] [--t-w-open:3rem] [--t-icon:1.25rem]",
        ],
        md: [
          "[--s-inner:0.25rem] [--s-inner-press:0.125rem]",
          "[--lead-pe:1.5rem] [--t-w:3.375rem] [--t-w-open:3.5rem] [--t-icon:1.5rem]",
        ],
        lg: [
          "[--s-inner:0.5rem] [--s-inner-press:0.25rem]",
          "[--lead-pe:3rem] [--t-w:5.625rem] [--t-w-open:6rem] [--t-icon:2rem]",
        ],
        xl: [
          "[--s-inner:0.75rem] [--s-inner-press:0.375rem]",
          "[--lead-pe:4rem] [--t-w:7.875rem] [--t-w-open:8.5rem] [--t-icon:2.5rem]",
        ],
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);
