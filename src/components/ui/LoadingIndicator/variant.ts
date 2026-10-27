import { cva } from "class-variance-authority";

export const loadingIndicatorVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full",
  {
    variants: {
      // The container sits behind the shape. Keep 3:1 contrast between the two.
      contained: {
        true: "bg-primary-container text-on-primary-container",
        false: "text-primary",
      },
    },
    defaultVariants: {
      contained: false,
    },
  },
);
