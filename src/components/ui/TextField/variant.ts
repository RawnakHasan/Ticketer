import { cva } from "class-variance-authority";

// Root: owns the state variables every part reads.
//   --f         0 or 1, 1 while the label is floated (focus, or the control isn't showing its placeholder)
//   --bw        outlined only: outline width, 1px or 3px while focused
//   --tf-line   active indicator (filled) or outline (outlined)
//   --tf-label  label color
//   --tf-trail  trailing icon color
//   --tf-dis    disabled content (on-surface at 38%)
//   --lead      how far the floated outlined label moves left when there is a leading icon
export const textFieldVariants = cva(
  [
    "group/field flex w-full min-w-0 flex-col text-on-surface",

    "[--f:0] focus-within:[--f:1] has-[[data-slot=text-field-control]:not(:placeholder-shown)]:[--f:1]",

    "[--tf-dis:color-mix(in_srgb,var(--md-sys-color-on-surface)_38%,transparent)]",
    "[--tf-label:var(--md-sys-color-on-surface-variant)] [--tf-trail:var(--md-sys-color-on-surface-variant)]",

    // Hover only when not focused, so a focused field keeps its primary color
    "[&:hover:not(:focus-within)]:[--tf-line:var(--md-sys-color-on-surface)]",
    "focus-within:[--tf-line:var(--md-sys-color-primary)] focus-within:[--tf-label:var(--md-sys-color-primary)]",

    // Error (also wins over focus)
    "data-invalid:[--tf-line:var(--md-sys-color-error)] data-invalid:[--tf-label:var(--md-sys-color-error)] data-invalid:[--tf-trail:var(--md-sys-color-error)]",
    "data-invalid:focus-within:[--tf-line:var(--md-sys-color-error)] data-invalid:focus-within:[--tf-label:var(--md-sys-color-error)]",
    "data-invalid:[&:hover:not(:focus-within)]:[--tf-line:var(--md-sys-color-on-error-container)]",
    "data-invalid:[&:hover:not(:focus-within)]:[--tf-label:var(--md-sys-color-on-error-container)]",
    "data-invalid:[&:hover:not(:focus-within)]:[--tf-trail:var(--md-sys-color-on-error-container)]",

    // Disabled (the line color is per variant)
    "data-disabled:pointer-events-none data-disabled:[--tf-label:var(--tf-dis)] data-disabled:[--tf-trail:var(--tf-dis)]",
  ],
  {
    variants: {
      variant: {
        filled: [
          "[--tf-line:var(--md-sys-color-on-surface-variant)]",
          "data-disabled:[--tf-line:var(--tf-dis)]",
        ],
        outlined: [
          "[--tf-line:var(--md-sys-color-outline)] [--bw:1px] focus-within:[--bw:3px]",
          "data-disabled:[--tf-line:color-mix(in_srgb,var(--md-sys-color-on-surface)_12%,transparent)]",
        ],
      },
      leading: {
        true: "[--lead:2.25rem]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "filled",
      leading: false,
    },
  },
);

// The 56dp box: icons, the text area and the indicator/outline
export const textFieldContainerVariants = cva(
  "relative flex min-h-14 w-full cursor-text items-start",
  {
    variants: {
      variant: {
        filled: [
          "rounded-t-sm bg-surface-container-highest group-data-disabled/field:bg-on-surface/4",
          // State layer: on-surface at 8% on hover
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-on-surface before:opacity-0 before:transition-opacity before:duration-150",
          "hover:before:opacity-[0.08]",
          // Active indicator: 1dp, 3dp while focused
          "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-(--tf-line) after:transition-[height,background-color] after:duration-150",
          "focus-within:after:h-[3px]",
        ],
        // The outline is the <fieldset> inside (see textFieldSlots.outline), nothing is drawn here
        outlined: "rounded-sm",
      },
      leading: { true: "ps-3", false: "ps-4" },
      trailing: { true: "pe-3", false: "pe-4" },
    },
    defaultVariants: { variant: "filled", leading: false, trailing: false },
  },
);

// Holds prefix, control, suffix and the label. It sits above the indicator/outline.
export const textFieldWrapperVariants = cva("relative z-1 flex min-w-0 flex-1", {
  variants: {
    variant: {
      filled: "pt-6 pb-2",
      outlined: "py-4",
    },
  },
  defaultVariants: { variant: "filled" },
});

// Resting: 16px, centered. Floated: 12px, at the top (filled) or on the outline (outlined).
// No background: the outlined notch is cut out of the outline itself.
export const textFieldLabelVariants = cva(
  [
    "pointer-events-none absolute z-1 max-w-full truncate whitespace-nowrap text-(--tf-label)",
    "[font-size:calc(1rem_-_0.25rem*var(--f))] [line-height:calc(1.5rem_-_0.5rem*var(--f))]",
    "transition-[top,inset-inline-start,font-size,line-height,color] duration-150 motion-reduce:transition-none",
  ],
  {
    variants: {
      variant: {
        filled: "start-0 [top:calc(1rem_-_0.5rem*var(--f))]",
        outlined: [
          "px-1",
          "[inset-inline-start:calc(-0.25rem_-_var(--lead,0px)*var(--f))]",
          "[top:calc(1rem_-_1.5rem*var(--f))]",
        ],
      },
    },
    defaultVariants: { variant: "filled" },
  },
);

const controlBase = [
  "w-full min-w-0 flex-1 bg-transparent p-0 text-base leading-6 tracking-[0.031em] text-on-surface caret-primary outline-none",
  // The placeholder only shows once the label has floated
  "placeholder:text-transparent focus:placeholder:text-on-surface-variant",
  "group-data-invalid/field:caret-error group-data-disabled/field:text-(--tf-dis)",
];

export const textFieldSlots = {
  input: [...controlBase, "h-6"].join(" "),
  textarea: [...controlBase, "min-h-6 resize-none field-sizing-content"].join(" "),
  // 56dp tall so it centers on the first line, and stays at the top in multi-line fields
  icon: "flex h-14 shrink-0 items-center justify-center self-start [&_svg]:size-6 [&_svg]:shrink-0",
  prefix:
    "shrink-0 text-base leading-6 text-on-surface-variant opacity-(--f) transition-opacity duration-150 motion-reduce:transition-none group-data-disabled/field:text-(--tf-dis)",
  suffix:
    "shrink-0 ps-2 text-base leading-6 text-on-surface-variant opacity-(--f) transition-opacity duration-150 motion-reduce:transition-none group-data-disabled/field:text-(--tf-dis)",
  support:
    "flex gap-4 px-4 pt-1 text-xs leading-4 tracking-[0.033em] text-on-surface-variant group-data-invalid/field:text-error group-data-disabled/field:text-(--tf-dis)",
  // Outlined only. The fieldset draws the outline and its legend (as wide as the floated label,
  // 0 while the label rests) makes the gap. It starts 8px above the container so the outline
  // lines up with the middle of the 16px legend.
  outline:
    "pointer-events-none absolute inset-x-0 -top-2 bottom-0 m-0 min-w-0 rounded-[inherit] border-[length:var(--bw,1px)] border-(color:--tf-line) p-0 ps-[calc(0.75rem_-_var(--bw,1px))] transition-[border-color,border-width,padding] duration-150 motion-reduce:transition-none",
  outlineLegend:
    "invisible block h-4 w-auto max-w-[calc(0.01px_+_var(--f)*100%)] p-0 text-xs leading-4 whitespace-nowrap transition-[max-width] duration-150 motion-reduce:transition-none",
} as const;
