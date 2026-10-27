import type { ComponentProps } from "react";

import { materialShapePath, type MaterialShapeName } from "@/lib/shapes/materialShapes";

type MaterialShapeProps = Omit<ComponentProps<"svg">, "children" | "viewBox"> & {
  name: MaterialShapeName;
};

// Fills with the current text color, size it with width/height or a size-* class
function MaterialShape({ name, ...props }: MaterialShapeProps) {
  return (
    <svg
      data-slot="material-shape"
      viewBox="-1 -1 2 2"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={materialShapePath(name)} />
    </svg>
  );
}

export { MaterialShape };
