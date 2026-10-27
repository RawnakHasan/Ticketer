import { useEffect, useRef, type ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { loadingIndicatorVariants } from "@/components/ui/LoadingIndicator/variant";
import { createLoadingMotion, loadingRotation, stepLoadingMotion } from "@/lib/loadingMotion";
import {
  LOADING_SEQUENCE,
  materialShapeRadii,
  polarPath,
  type MaterialShapeName,
} from "@/lib/shapes/materialShapes";

type LoadingIndicatorVariants = VariantProps<typeof loadingIndicatorVariants>;

type LoadingIndicatorProps = Omit<ComponentProps<"div">, "className" | "children"> &
  LoadingIndicatorVariants & {
    // Size of the container in px. The shape is 34/48 of it, like the 34dp shape in a 48dp container.
    size?: number;
    // Shapes to morph through, in order (any of the 35). Defaults to the M3 sequence.
    shapes?: readonly MaterialShapeName[];
    className?: string;
  };

function LoadingIndicator({
  className,
  contained,
  size = 48,
  shapes = LOADING_SEQUENCE,
  style,
  ...props
}: LoadingIndicatorProps) {
  const groupRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // A string, so the animation only restarts when the sequence actually changes
  const sequenceKey = shapes.join(",");

  useEffect(() => {
    const group = groupRef.current;
    const path = pathRef.current;
    if (!group || !path) return;

    const names = sequenceKey.split(",") as MaterialShapeName[];
    const radii = names.map((name) => materialShapeRadii(name));
    const blended = new Float32Array(radii[0].length);
    const motion = createLoadingMotion();
    // The spin is the part that bothers people with motion sensitivity, the morph stays
    const spin = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      const whole = Math.floor(motion.position);
      const from = radii[((whole % names.length) + names.length) % names.length];
      const to = radii[(((whole + 1) % names.length) + names.length) % names.length];
      const fraction = motion.position - whole;
      for (let k = 0; k < blended.length; k++) {
        blended[k] = from[k] + (to[k] - from[k]) * fraction;
      }
      path.setAttribute("d", polarPath(blended));
      // 0 degrees is at the top
      group.setAttribute("transform", `rotate(${(spin ? loadingRotation(motion) : 0) - 90})`);
    };

    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      // Cap the step so coming back to a hidden tab doesn't fast-forward the animation
      stepLoadingMotion(motion, Math.min(now - last, 50));
      last = now;
      draw();
      frame = requestAnimationFrame(tick);
    };

    draw();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [sequenceKey]);

  return (
    <div
      role="progressbar"
      aria-label="Loading"
      data-slot="loading-indicator"
      className={cn(loadingIndicatorVariants({ contained }), className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <svg viewBox="-1 -1 2 2" className="w-[70.8333%]" aria-hidden="true" focusable="false">
        <g ref={groupRef}>
          <path
            ref={pathRef}
            fill="currentColor"
            d={polarPath(materialShapeRadii(shapes[0] ?? LOADING_SEQUENCE[0]))}
          />
        </g>
      </svg>
    </div>
  );
}

export { LoadingIndicator };
