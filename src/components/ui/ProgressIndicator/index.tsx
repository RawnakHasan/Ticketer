import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { useLayoutEffect, useRef } from "react";

import {
  circularProgressIndicatorSpec,
  circularProgressIndicatorVariants,
  linearProgressIndicatorSpec,
  linearProgressIndicatorVariants,
  type CircularProgressIndicatorVariants,
  type LinearProgressIndicatorVariants,
} from "@/components/ui/ProgressIndicator/variant";
import { useElementWidth } from "@/hooks/useElementWidth";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { clamp, runAnimationLoop } from "@/lib/motion";
import {
  NO_STROKE,
  arcDegrees,
  flatArc,
  flatBar,
  setStroke,
  wavyArc,
  wavyBar,
} from "@/lib/progressGeometry";
import {
  DeterminateMotion,
  circularIndeterminate,
  linearIndeterminate,
  wavePhase,
} from "@/lib/progressMotion";
import { cn } from "@/lib/utils";

// A progress bar has no visible text, so it needs a name for screen readers
type AccessibleName = { "aria-label": string } | { "aria-labelledby": string };

type ProgressIndicatorBaseProps = Omit<
  ProgressPrimitive.Root.Props,
  "className" | "value" | "children"
> &
  AccessibleName & {
    // Leave it out (or pass null) when the time it takes is unknown
    value?: number | null;
    className?: string;
  };

type LinearProgressIndicatorProps = ProgressIndicatorBaseProps & LinearProgressIndicatorVariants;

type CircularProgressIndicatorProps = ProgressIndicatorBaseProps &
  CircularProgressIndicatorVariants & {
    // The wave is a shape of the circular indicator too, not only of the linear one
    shape?: "flat" | "wavy" | null;
  };

function LinearProgressIndicator({
  className,
  value,
  min = 0,
  max = 100,
  thickness,
  shape,
  ...props
}: LinearProgressIndicatorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(SVGPathElement | null)[]>([]);
  const indicatorRefs = useRef<(SVGPathElement | null)[]>([]);
  const stopRef = useRef<SVGCircleElement>(null);
  const motionRef = useRef<DeterminateMotion | null>(null);
  const width = useElementWidth(rootRef);
  const reducedMotion = usePrefersReducedMotion();

  const wavy = shape === "wavy";
  const spec = linearProgressIndicatorSpec;
  const trackThickness = spec.thickness[thickness ?? "thin"];
  const height = trackThickness + (wavy ? spec.amplitude * 2 : 0);
  const indeterminate = value == null;
  const fraction = value == null ? 0 : clamp((value - min) / (max - min), 0, 1);

  useLayoutEffect(() => {
    if (width <= 0) return;
    const wavelength = indeterminate ? spec.wavelengthIndeterminate : spec.wavelength;
    // A whole number of waves fits the track
    const adjustedWavelength = width / Math.max(1, Math.floor(width / wavelength));

    // The gap shrinks to 0 at both ends of the track, so a full track has no gap at its ends
    const track = (from: number, to: number) =>
      flatBar(
        from * width + (spec.gap * clamp(from, 0, 0.01)) / 0.01,
        to * width - (spec.gap * (1 - clamp(to, 0.99, 1))) / 0.01,
        trackThickness,
      );
    const bar = (from: number, to: number, amplitude: number, phase: number) =>
      wavy
        ? wavyBar(
            from * width,
            to * width,
            trackThickness,
            spec.amplitude * amplitude,
            adjustedWavelength,
            phase,
          )
        : flatBar(from * width, to * width, trackThickness);

    const stop = stopRef.current;
    if (stop) {
      stop.setAttribute("cx", String(width - trackThickness / 2));
      stop.style.display = indeterminate ? "none" : "";
    }

    if (indeterminate) {
      const draw = (time: number) => {
        const bars = linearIndeterminate(time);
        const phase = reducedMotion ? 0 : wavePhase(time);
        setStroke(indicatorRefs.current[0], bar(bars[0].start, bars[0].end, 1, phase));
        setStroke(indicatorRefs.current[1], bar(bars[1].start, bars[1].end, 1, phase));
        setStroke(trackRefs.current[0], track(0, bars[0].start));
        setStroke(trackRefs.current[1], track(bars[0].end, bars[1].start));
        setStroke(trackRefs.current[2], track(bars[1].end, 1));
      };
      let time = 0;
      draw(time);
      return runAnimationLoop((dt) => {
        time += dt;
        draw(time);
      });
    }

    const motion = (motionRef.current ??= new DeterminateMotion(fraction));
    motion.setTarget(fraction, !reducedMotion);
    const driftWave = wavy && !reducedMotion;
    const draw = () => {
      setStroke(indicatorRefs.current[0], bar(0, motion.progress, motion.amplitude, motion.phase));
      setStroke(indicatorRefs.current[1], NO_STROKE);
      setStroke(trackRefs.current[0], NO_STROKE);
      setStroke(trackRefs.current[1], NO_STROKE);
      setStroke(trackRefs.current[2], track(motion.progress, 1));
    };
    draw();
    if (motion.settled && !driftWave) return;
    return runAnimationLoop((dt) => {
      motion.step(dt, 1 / width, driftWave);
      draw();
      return !motion.settled || driftWave;
    });
  }, [width, indeterminate, fraction, wavy, trackThickness, reducedMotion, spec]);

  return (
    <ProgressPrimitive.Root
      ref={rootRef}
      data-slot="linear-progress-indicator"
      value={value ?? null}
      min={min}
      max={max}
      className={cn(linearProgressIndicatorVariants({ thickness, shape }), className)}
      {...props}
    >
      {width > 0 && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
          className="block"
        >
          <g transform={`translate(0 ${height / 2})`} fill="none" strokeLinecap="round">
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                ref={(el) => {
                  trackRefs.current[i] = el;
                }}
                className="stroke-secondary-container"
              />
            ))}
            {[0, 1].map((i) => (
              <path
                key={i}
                ref={(el) => {
                  indicatorRefs.current[i] = el;
                }}
                className="stroke-current"
              />
            ))}
            <circle
              ref={stopRef}
              r={spec.stopIndicatorSize / 2}
              className="fill-current stroke-none"
            />
          </g>
        </svg>
      )}
    </ProgressPrimitive.Root>
  );
}

function CircularProgressIndicator({
  className,
  value,
  min = 0,
  max = 100,
  thickness,
  shape,
  ...props
}: CircularProgressIndicatorProps) {
  const groupRef = useRef<SVGGElement>(null);
  const trackRef = useRef<SVGPathElement>(null);
  const indicatorRef = useRef<SVGPathElement>(null);
  const motionRef = useRef<DeterminateMotion | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const wavy = shape === "wavy";
  const spec = circularProgressIndicatorSpec;
  const thicknessKey = thickness ?? "thin";
  const trackThickness = spec.thickness[thicknessKey];
  const size = spec.size[thicknessKey];
  const indeterminate = value == null;
  const fraction = value == null ? 0 : clamp((value - min) / (max - min), 0, 1);

  useLayoutEffect(() => {
    const radius = wavy ? spec.radius.wavy : spec.radius.flat;
    const gapDegrees = arcDegrees(spec.gap / radius);

    // Near a full circle the ends overlap, so the round caps don't leave a notch
    const capDegrees = arcDegrees(trackThickness / 2 / radius);
    const arc = (to: number, amplitude: number, phase: number) => {
      const sweep = to * 360 + (Math.max(to - 0.99, 0) / 0.01) * capDegrees * 2;
      return wavy
        ? wavyArc(
            radius,
            0,
            sweep,
            trackThickness,
            spec.amplitude * amplitude,
            spec.wavelength,
            phase,
          )
        : flatArc(radius, 0, sweep, trackThickness);
    };
    // Arcs are given as fractions of the circle
    const track = (from: number, gap: number) =>
      flatArc(radius, from * 360 + gap, (1 - from) * 360 - gap * 2, trackThickness);

    if (indeterminate) {
      const draw = (time: number) => {
        const { rotation, end } = circularIndeterminate(time);
        groupRef.current?.setAttribute("transform", `rotate(${rotation.toFixed(2)})`);
        setStroke(indicatorRef.current, arc(end, 1, reducedMotion ? 0 : wavePhase(time)));
        setStroke(trackRef.current, track(end, gapDegrees));
      };
      let time = 0;
      draw(time);
      return runAnimationLoop((dt) => {
        time += dt;
        draw(time);
      });
    }

    groupRef.current?.removeAttribute("transform");
    const motion = (motionRef.current ??= new DeterminateMotion(fraction));
    motion.setTarget(fraction, !reducedMotion);
    const driftWave = wavy && !reducedMotion;
    const draw = () => {
      // The gap grows from 0 over the first 1% of progress, so an empty indicator shows a full track
      const gap = (gapDegrees * clamp(motion.progress, 0, 0.01)) / 0.01;
      setStroke(indicatorRef.current, arc(motion.progress, motion.amplitude, motion.phase));
      setStroke(trackRef.current, track(motion.progress, gap));
    };
    draw();
    if (motion.settled && !driftWave) return;
    return runAnimationLoop((dt) => {
      motion.step(dt, 1 / (Math.PI * size), driftWave);
      draw();
      return !motion.settled || driftWave;
    });
  }, [indeterminate, fraction, wavy, trackThickness, size, reducedMotion, spec]);

  return (
    <ProgressPrimitive.Root
      data-slot="circular-progress-indicator"
      value={value ?? null}
      min={min}
      max={max}
      className={cn(circularProgressIndicatorVariants({ thickness }), className)}
      {...props}
    >
      <svg
        viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        aria-hidden="true"
        className="block size-full"
      >
        <g fill="none" strokeLinecap="round">
          <g ref={groupRef}>
            <path ref={trackRef} className="stroke-secondary-container" />
            <path ref={indicatorRef} className="stroke-current" />
          </g>
        </g>
      </svg>
    </ProgressPrimitive.Root>
  );
}

export { LinearProgressIndicator, CircularProgressIndicator };
