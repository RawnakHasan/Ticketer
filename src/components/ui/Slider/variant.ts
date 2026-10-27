import { cva } from "class-variance-authority";

export const sliderVariants = cva(
  [
    "group/slider relative flex touch-none select-none data-disabled:cursor-not-allowed data-disabled:opacity-40",
    "data-[dragging]:cursor-grabbing [--slider-inside-radius:2px]",
  ],
  {
    variants: {
      orientation: {
        horizontal: "w-full items-center",
        vertical: "h-64 w-12 justify-center",
      },
      size: {
        xs: "[--slider-track-radius:8px]",
        s: "[--slider-track-radius:8px]",
        m: "[--slider-track-radius:12px]",
        l: "[--slider-track-radius:16px]",
        xl: "[--slider-track-radius:28px]",
      },
      variant: {
        standard: "",
        centered: "",
        range: "",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      size: "m",
      variant: "standard",
    },
  },
);

export const sliderControlVariants = cva("relative flex touch-none select-none", {
  variants: {
    orientation: {
      horizontal: "min-h-12 w-full items-center",
      vertical: "h-full w-full justify-center",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export const sliderTrackVariants = cva("relative overflow-visible", {
  variants: {
    orientation: {
      horizontal: "w-full",
      vertical: "h-full",
    },
    size: {
      xs: "rounded-lg [--slider-track-radius:8px]",
      s: "rounded-lg [--slider-track-radius:8px]",
      m: "rounded-xl [--slider-track-radius:12px]",
      l: "rounded-2xl [--slider-track-radius:16px]",
      xl: "rounded-[28px] [--slider-track-radius:28px]",
    },
  },
  compoundVariants: [
    { orientation: "horizontal", size: "xs", className: "h-4" },
    { orientation: "horizontal", size: "s", className: "h-6" },
    { orientation: "horizontal", size: "m", className: "h-10" },
    { orientation: "horizontal", size: "l", className: "h-14" },
    { orientation: "horizontal", size: "xl", className: "h-24" },
    { orientation: "vertical", size: "xs", className: "w-4" },
    { orientation: "vertical", size: "s", className: "w-6" },
    { orientation: "vertical", size: "m", className: "w-10" },
    { orientation: "vertical", size: "l", className: "w-14" },
    { orientation: "vertical", size: "xl", className: "w-24" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    size: "m",
  },
});

export const sliderThumbVariants = cva(
  [
    "z-20! flex shrink-0 items-center justify-center rounded-full bg-primary outline-none",
    "transition-[height,width,background-color] duration-150 motion-reduce:transition-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
    "data-disabled:bg-on-surface-variant",
  ],
  {
    variants: {
      orientation: {
        horizontal: "w-1",
        vertical: "h-1",
      },
      size: {
        xs: "h-11",
        s: "h-11",
        m: "h-[52px]",
        l: "h-[68px]",
        xl: "h-[108px]",
      },
    },
    compoundVariants: [
      { orientation: "vertical", size: "xs", className: "h-1 w-11" },
      { orientation: "vertical", size: "s", className: "h-1 w-11" },
      { orientation: "vertical", size: "m", className: "h-1 w-[52px]" },
      { orientation: "vertical", size: "l", className: "h-1 w-[68px]" },
      { orientation: "vertical", size: "xl", className: "h-1 w-[108px]" },
    ],
    defaultVariants: {
      orientation: "horizontal",
      size: "m",
    },
  },
);
