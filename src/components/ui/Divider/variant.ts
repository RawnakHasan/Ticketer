import { cva, type VariantProps } from "class-variance-authority";

export const dividerVariants = cva("shrink-0 bg-outline-variant", {
  variants: {
    orientation: {
      horizontal: "h-px",
      vertical: "w-px self-stretch",
    },
    inset: {
      none: "",
      start: "",
      middle: "",
    },
  },
  compoundVariants: [
    { orientation: "horizontal", inset: "none", class: "w-full" },
    { orientation: "horizontal", inset: "start", class: "ml-4 w-[calc(100%-1rem)]" },
    { orientation: "horizontal", inset: "middle", class: "mx-4 w-[calc(100%-2rem)]" },
  ],
  defaultVariants: {
    orientation: "horizontal",
    inset: "none",
  },
});

export type DividerVariants = VariantProps<typeof dividerVariants>;
