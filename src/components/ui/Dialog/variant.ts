import { cva } from "class-variance-authority";

// How the dialog looks and is sized. The docs page also uses this on plain elements to
// show static specimens, so it has no positioning in it (see dialogPopupVariants).
export const dialogVariants = cva(
  ["flex flex-col bg-surface-container-high text-on-surface outline-none"],
  {
    variants: {
      variant: {
        // 28dp corners, 24dp padding, 16dp between parts, 280dp to 560dp wide.
        // With an icon the headline is centered, otherwise it is start-aligned.
        basic: [
          "w-max min-w-70 max-w-[min(35rem,calc(100vw-3rem))] max-h-[calc(100dvh-3rem)]",
          "gap-4 rounded-[28px] p-6",
          "has-data-[slot=dialog-icon]:[&_[data-slot=dialog-title]]:text-center",
        ],
        // Square corners, no padding of its own: the header and body set theirs
        fullscreen: "w-full rounded-none",
      },
    },
    defaultVariants: {
      variant: "basic",
    },
  },
);

// Where the dialog sits and how it appears and disappears
export const dialogPopupVariants = cva(
  [
    "fixed z-50 motion-reduce:transition-none",
    "data-starting-style:opacity-0 data-ending-style:opacity-0",
  ],
  {
    variants: {
      variant: {
        // Centered, grows in from 95%
        basic: [
          "top-1/2 left-1/2 -translate-1/2",
          "transition-[opacity,scale] duration-200",
          "data-starting-style:scale-95 data-ending-style:scale-95",
        ],
        // Covers the screen, slides up a little
        fullscreen: [
          "inset-0",
          "transition-[opacity,translate] duration-200",
          "data-starting-style:translate-y-6 data-ending-style:translate-y-6",
        ],
      },
    },
    defaultVariants: {
      variant: "basic",
    },
  },
);

// Scrim: the scrim color at 32% behind the dialog
export const dialogScrimClass =
  "fixed inset-0 z-50 bg-scrim/32 transition-opacity duration-200 motion-reduce:transition-none data-starting-style:opacity-0 data-ending-style:opacity-0";

// Classes of the parts, shared by the components and the docs specimens.
// Spacing between parts comes from the gap of the basic dialog (16dp), the actions add 8dp
// more so the space above them is 24dp.
export const dialogSlots = {
  icon: "flex justify-center text-secondary [&_svg]:size-6 [&_svg]:shrink-0",
  title: "text-2xl leading-8 text-on-surface",
  description: "text-sm leading-5 text-on-surface-variant",
  // Scrolls when the dialog is taller than the screen
  body: "min-h-0 flex-1 overflow-y-auto",
  actions: "flex flex-wrap items-center justify-end gap-2 pt-2",
  divider: "h-px shrink-0 bg-outline-variant",
  // Full-screen header: 56dp tall, close button, headline, then a text button
  header: [
    "flex h-14 shrink-0 items-center gap-2 px-4",
    "[&>[data-slot=dialog-title]]:flex-1 [&>[data-slot=dialog-title]]:truncate",
    "[&>[data-slot=dialog-title]]:text-[1.375rem] [&>[data-slot=dialog-title]]:leading-7",
  ].join(" "),
} as const;
