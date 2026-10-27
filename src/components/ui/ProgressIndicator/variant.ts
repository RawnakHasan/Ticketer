import { cva, type VariantProps } from "class-variance-authority";

// The numbers below come from the M3 Expressive progress indicator tokens
// (md.comp.progress-indicator) as they are used in material-components-android, in px.
export const linearProgressIndicatorSpec = {
  // Track height: thin is the default, thick is the Expressive 8dp track
  thickness: { thin: 4, thick: 8 },
  // Space between the active indicator and the rest of the track
  gap: 4,
  // The dot at the end of the track, determinate only
  stopIndicatorSize: 4,
  // The wave goes this far to each side of the track, so wavy makes the indicator taller
  amplitude: 3,
  wavelength: 40,
  wavelengthIndeterminate: 20,
} as const;

export const circularProgressIndicatorSpec = {
  thickness: { thin: 4, thick: 8 },
  // Outer size, wave included. The flat indicator sits inside it with a 4dp inset.
  size: { thin: 48, thick: 52 },
  // Radius of the middle of the track
  radius: { flat: 18, wavy: 22 },
  gap: 4,
  amplitude: 1.6,
  wavelength: 15,
} as const;

// The root is as wide as its container and as tall as the track (plus the wave). Heights are px so
// they match the drawing exactly: track height + 2 * wave amplitude when wavy.
export const linearProgressIndicatorVariants = cva("relative block w-full shrink-0 text-primary", {
  variants: {
    thickness: {
      thin: "",
      thick: "",
    },
    shape: {
      flat: "",
      wavy: "",
    },
  },
  compoundVariants: [
    { thickness: "thin", shape: "flat", className: "h-[4px]" },
    { thickness: "thin", shape: "wavy", className: "h-[10px]" },
    { thickness: "thick", shape: "flat", className: "h-[8px]" },
    { thickness: "thick", shape: "wavy", className: "h-[14px]" },
  ],
  defaultVariants: {
    thickness: "thin",
    shape: "flat",
  },
});

// Scales with its size classes: 48px for thin, 52px for thick
export const circularProgressIndicatorVariants = cva(
  "relative inline-block shrink-0 text-primary",
  {
    variants: {
      thickness: {
        thin: "size-12",
        thick: "size-13",
      },
    },
    defaultVariants: {
      thickness: "thin",
    },
  },
);

export type LinearProgressIndicatorVariants = VariantProps<typeof linearProgressIndicatorVariants>;
export type CircularProgressIndicatorVariants = VariantProps<
  typeof circularProgressIndicatorVariants
>;
