import { cva } from "class-variance-authority";

export const tabsListVariants = cva([
  "relative flex w-full items-stretch bg-surface",
  // Divider: 1dp, drawn inside the height of the list
  "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-outline-variant",
]);

export const tabVariants = cva(
  [
    "group relative flex min-w-0 flex-1 cursor-pointer items-stretch justify-center select-none outline-none",
    "text-sm font-medium tracking-[0.007em] text-on-surface-variant",
    "transition-colors duration-150 motion-reduce:transition-none",

    // State layer: 8% on hover, 10% on focus and press. It uses on-surface for inactive tabs
    // and primary for the active one. (active: is the pressed pseudo-class, data-active is
    // the selected tab.)
    "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-on-surface after:opacity-0 after:transition-opacity",
    "hover:after:opacity-[0.08] focus-visible:after:opacity-10 active:after:opacity-10",
    "data-active:after:bg-primary",

    // Focus ring sits inside the tab
    "focus-visible:rounded-xl focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-secondary",

    // Disabled
    "data-disabled:pointer-events-none data-disabled:text-on-surface/38!",
  ],
  {
    variants: {
      variant: {
        primary: "px-3 data-active:text-primary",
        secondary: "data-active:text-on-surface",
      },
      // Primary tabs with an icon stack it above the label, and are taller
      stacked: {
        true: "h-16",
        false: "h-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      stacked: false,
    },
  },
);

// Wraps the icon and label. For primary tabs it is only as wide as its content, which is
// the width of the active indicator. Secondary tabs fill the whole tab.
export const tabContentVariants = cva("relative flex h-full items-center justify-center", {
  variants: {
    variant: {
      primary: "min-w-7",
      secondary: "w-full gap-2 px-4",
    },
    stacked: {
      true: "flex-col gap-0.5",
      false: "",
    },
  },
  defaultVariants: {
    variant: "primary",
    stacked: false,
  },
});

// Grows in from the middle when the tab becomes active
export const tabIndicatorVariants = cva(
  [
    "pointer-events-none absolute bottom-0 z-10 scale-x-0 bg-primary opacity-0",
    "transition-[scale,opacity] duration-200 motion-reduce:transition-none",
    "group-data-active:scale-x-100 group-data-active:opacity-100",
    "group-data-disabled:bg-on-surface/38",
  ],
  {
    variants: {
      variant: {
        // 3dp tall, inset 2dp on each side, rounded on top
        primary: "inset-x-0.5 h-[3px] rounded-t-[3px]",
        // 2dp tall, as wide as the tab
        secondary: "inset-x-0 h-0.5",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export const tabBadgeVariants = cva(
  "pointer-events-none inline-flex shrink-0 items-center justify-center rounded-full bg-error text-on-error",
  {
    variants: {
      size: {
        small: "size-1.5",
        large: "h-4 min-w-4 px-1 text-[11px] leading-4 font-medium tracking-[0.04em]",
      },
      // On a stacked icon the badge overlaps its top-right corner, inline it follows the label
      placement: {
        icon: "absolute",
        inline: "ml-1",
      },
    },
    compoundVariants: [
      { size: "small", placement: "icon", className: "-top-0.5 left-[calc(100%-0.25rem)]" },
      { size: "large", placement: "icon", className: "-top-1 left-[calc(100%-0.375rem)]" },
    ],
    defaultVariants: {
      size: "large",
      placement: "inline",
    },
  },
);
