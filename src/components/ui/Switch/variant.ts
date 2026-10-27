import { cva } from "class-variance-authority";

export const switchVariants = cva([
  "group relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center rounded-full! border-2 border-outline bg-surface-container-highest outline-none",
  "transition-colors duration-150 motion-reduce:transition-none",
  "before:pointer-events-none before:absolute before:-inset-2 before:rounded-full before:bg-current before:opacity-0 before:transition-opacity",
  "hover:before:opacity-[0.08] focus-visible:before:opacity-10 active:before:opacity-10",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
  "data-checked:border-primary data-checked:bg-primary data-checked:text-primary",
  "data-disabled:pointer-events-none data-disabled:cursor-not-allowed",
  "data-disabled:border-on-surface/12 data-disabled:bg-on-surface/12 data-disabled:text-on-surface/38",
]);

export const switchThumbVariants = cva(
  [
    // anchor by center: 14px from the track's inner-left = 16px from the outer edge
    "absolute top-1/2 left-3.5 z-10 flex items-center justify-center rounded-full!",
    "-translate-x-1/2 -translate-y-1/2",
    "transition-[width,height,translate,background-color] duration-150 motion-reduce:transition-none",
    // checked: center moves 20px right
    "group-data-checked:translate-x-[calc(-50%+20px)]",
    // pressed: grows in place
    "group-active:size-7 group-data-checked:group-active:size-7",
    "group-data-disabled:bg-on-surface/38",
  ],
  {
    variants: {
      iconMode: {
        none: ["size-4 bg-outline", "group-data-checked:size-6 group-data-checked:bg-on-primary"],
        checked: [
          "size-4 bg-outline",
          "group-data-checked:size-6 group-data-checked:bg-on-primary",
        ],
        both: "size-6 bg-on-surface-variant group-data-checked:bg-on-primary",
      },
    },
    defaultVariants: {
      iconMode: "none",
    },
  },
);
