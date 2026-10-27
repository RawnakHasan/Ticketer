import type { ComponentProps } from "react";
import { Separator } from "@base-ui/react/separator";
import { dividerVariants, type DividerVariants } from "./variant";

export type DividerProps = Omit<ComponentProps<typeof Separator>, "orientation" | "className"> &
  DividerVariants & { className?: string };

export function Divider({ orientation, inset, className, ...props }: DividerProps) {
  const o = orientation ?? "horizontal";

  return (
    <Separator
      orientation={o}
      className={dividerVariants({ orientation: o, inset, className })}
      {...props}
    />
  );
}

export default Divider;
