import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import type { SliderRootProps } from "@base-ui/react/slider";
import { useState, type ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  sliderControlVariants,
  sliderThumbVariants,
  sliderTrackVariants,
  sliderVariants,
} from "@/components/ui/Slider/variant";

type SliderValue = number | readonly number[];
type SliderStyleVariants = VariantProps<typeof sliderVariants>;

type SliderProps = Omit<SliderRootProps<SliderValue>, "className" | "defaultValue"> &
  SliderStyleVariants & {
    "aria-label": string;
    defaultValue?: SliderValue;
    className?: string;
    trackClassName?: string;
    thumbClassName?: string;
    stops?: readonly number[];
    snapToStops?: boolean;
    valueIndicator?: boolean;
    insetIcon?: ReactNode;
    getAriaLabel?: (index: number) => string;
    thumbTrackGapSize?: number;
    showEndIndicator?: boolean;
  };

function Slider({
  "aria-label": ariaLabel,
  className,
  trackClassName,
  thumbClassName,
  defaultValue,
  value,
  onValueChange,
  step,
  min,
  max,
  orientation = "horizontal",
  size = "m",
  variant = "standard",
  stops,
  snapToStops,
  valueIndicator = false,
  insetIcon,
  getAriaLabel,
  thumbTrackGapSize = 6,
  showEndIndicator = true,
  ...props
}: SliderProps) {
  const resolvedMin = min ?? (variant === "centered" ? -100 : 0);
  const resolvedMax = max ?? 100;
  const stopValues = (stops ?? [])
    .filter((stop) => stop > resolvedMin && stop < resolvedMax)
    .sort((first, second) => first - second);
  const shouldSnapToStops = snapToStops ?? stopValues.length > 0;
  const stopPoints = [resolvedMin, ...stopValues, resolvedMax];
  const stopIntervals = stopPoints.slice(1).map((stop, index) => stop - stopPoints[index]);
  const inferredStep =
    stopIntervals.length > 0 &&
    stopIntervals.every((interval) => Math.abs(interval - stopIntervals[0]) < 1e-8)
      ? stopIntervals[0]
      : undefined;
  const snapValue = (current: number) => {
    if (!shouldSnapToStops || stopValues.length === 0) return current;

    return [resolvedMin, ...stopValues, resolvedMax].reduce((nearest, stop) =>
      Math.abs(stop - current) < Math.abs(nearest - current) ? stop : nearest,
    );
  };
  const normalizeValue = (current: SliderValue): SliderValue =>
    typeof current === "number"
      ? snapValue(current)
      : current.map(snapValue).sort((first, second) => first - second);
  const [uncontrolledValue, setUncontrolledValue] = useState<SliderValue>(() =>
    normalizeValue(
      value ?? defaultValue ?? (variant === "range" ? [25, 75] : variant === "centered" ? 0 : 40),
    ),
  );
  const currentValue = value ?? uncontrolledValue;
  const currentValues = typeof currentValue === "number" ? [currentValue] : currentValue;
  const isCentered = variant === "centered" && typeof currentValue === "number";
  const thumbGap = thumbTrackGapSize + 2;
  const percentFor = (current: number) =>
    Math.max(0, Math.min(100, ((current - resolvedMin) / (resolvedMax - resolvedMin)) * 100));
  const thumbPercents = currentValues.map(percentFor);
  const segments: {
    start: number;
    end: number;
    startGap: number;
    endGap: number;
    active: boolean;
  }[] = [];

  if (isCentered) {
    const thumbPercent = thumbPercents[0];
    const midpoint = percentFor(0);

    if (thumbPercent < midpoint) {
      segments.push(
        { start: 0, end: thumbPercent, startGap: 0, endGap: thumbGap, active: false },
        { start: thumbPercent, end: midpoint, startGap: thumbGap, endGap: 0, active: true },
        { start: midpoint, end: 100, startGap: 0, endGap: 0, active: false },
      );
    } else if (thumbPercent > midpoint) {
      segments.push(
        { start: 0, end: midpoint, startGap: 0, endGap: 0, active: false },
        { start: midpoint, end: thumbPercent, startGap: 0, endGap: thumbGap, active: true },
        { start: thumbPercent, end: 100, startGap: thumbGap, endGap: 0, active: false },
      );
    } else {
      segments.push(
        { start: 0, end: midpoint, startGap: 0, endGap: thumbGap, active: false },
        { start: midpoint, end: 100, startGap: thumbGap, endGap: 0, active: false },
      );
    }
  } else if (currentValues.length > 1) {
    segments.push(
      { start: 0, end: thumbPercents[0], startGap: 0, endGap: thumbGap, active: false },
      {
        start: thumbPercents[0],
        end: thumbPercents[thumbPercents.length - 1],
        startGap: thumbGap,
        endGap: thumbGap,
        active: true,
      },
      {
        start: thumbPercents[thumbPercents.length - 1],
        end: 100,
        startGap: thumbGap,
        endGap: 0,
        active: false,
      },
    );
  } else {
    segments.push(
      { start: 0, end: thumbPercents[0], startGap: 0, endGap: thumbGap, active: true },
      { start: thumbPercents[0], end: 100, startGap: thumbGap, endGap: 0, active: false },
    );
  }

  function handleValueChange(
    nextValue: SliderValue,
    eventDetails: Parameters<NonNullable<SliderRootProps<SliderValue>["onValueChange"]>>[1],
  ) {
    const normalizedValue = normalizeValue(nextValue);
    if (value === undefined) setUncontrolledValue(normalizedValue);
    onValueChange?.(normalizedValue, eventDetails);
  }

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      data-variant={variant}
      className={cn(sliderVariants({ orientation, size, variant }), className)}
      value={currentValue}
      onValueChange={handleValueChange}
      min={resolvedMin}
      max={resolvedMax}
      orientation={orientation}
      step={step ?? (shouldSnapToStops ? inferredStep : undefined)}
      {...props}
    >
      <SliderPrimitive.Control className={sliderControlVariants({ orientation })}>
        <SliderPrimitive.Track
          className={cn(
            sliderTrackVariants({ orientation, size }),
            "bg-transparent",
            trackClassName,
          )}
        >
          <SliderPrimitive.Indicator className="hidden" />
          {segments.map(({ start, end, startGap, endGap, active }, index) => {
            const startIsOuter = start === 0;
            const endIsOuter = end === 100;
            const segmentCorners =
              orientation === "horizontal"
                ? cn(
                    startIsOuter
                      ? "rounded-s-(--slider-track-radius)"
                      : "rounded-s-(--slider-inside-radius)",
                    endIsOuter
                      ? "rounded-e-(--slider-track-radius)"
                      : "rounded-e-(--slider-inside-radius)",
                  )
                : cn(
                    startIsOuter
                      ? "rounded-b-(--slider-track-radius)"
                      : "rounded-b-(--slider-inside-radius)",
                    endIsOuter
                      ? "rounded-t-(--slider-track-radius)"
                      : "rounded-t-(--slider-inside-radius)",
                  );

            return (
              <span
                key={`track-segment-${index}`}
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute",
                  active ? "bg-primary" : "bg-surface-container-highest",
                  segmentCorners,
                  orientation === "horizontal" ? "inset-y-0" : "inset-x-0",
                )}
                style={
                  orientation === "horizontal"
                    ? {
                        insetInlineStart: `calc(${start}% + ${startGap}px)`,
                        width: `calc(${end - start}% - ${startGap + endGap}px)`,
                      }
                    : {
                        bottom: `calc(${start}% + ${startGap}px)`,
                        height: `calc(${end - start}% - ${startGap + endGap}px)`,
                      }
                }
              />
            );
          })}
          {insetIcon && (
            <span className="pointer-events-none absolute inset-s-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center text-on-primary [&_svg]:size-4">
              {insetIcon}
            </span>
          )}
          {stopValues.length > 0 && (
            <div className="pointer-events-none absolute inset-0 z-10">
              {stopValues.map((stopValue) => {
                const position = percentFor(stopValue);
                const isActive = isCentered
                  ? stopValue >= Math.min(currentValue, 0) && stopValue <= Math.max(currentValue, 0)
                  : currentValues.length > 1
                    ? stopValue >= currentValues[0] &&
                      stopValue <= currentValues[currentValues.length - 1]
                    : stopValue <= currentValues[0];

                return (
                  <span
                    key={stopValue}
                    className={cn(
                      "absolute size-1 -translate-x-1/2 -translate-y-1/2 rounded-full",
                      isActive ? "bg-on-primary/70" : "bg-on-surface-variant/70",
                      orientation === "horizontal" ? "top-1/2" : "inset-s-1/2",
                    )}
                    style={
                      orientation === "horizontal"
                        ? { insetInlineStart: `${position}%` }
                        : { bottom: `${position}%` }
                    }
                  />
                );
              })}
            </div>
          )}
          {showEndIndicator && (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute z-10 size-1 rounded-full bg-on-surface-variant",
                orientation === "horizontal"
                  ? "inset-e-0 top-1/2 -translate-y-1/2"
                  : "left-1/2 top-0 -translate-x-1/2",
              )}
            />
          )}
        </SliderPrimitive.Track>
        {currentValues.map((current, index) => (
          <SliderPrimitive.Thumb
            key={index}
            index={currentValues.length > 1 ? index : undefined}
            getAriaLabel={
              getAriaLabel ??
              (() =>
                currentValues.length > 1
                  ? `${ariaLabel} ${index === 0 ? "start" : "end"}`
                  : ariaLabel)
            }
            className={cn(
              sliderThumbVariants({ orientation, size }),
              valueIndicator && "group/thumb relative",
              thumbClassName,
            )}
          >
            {valueIndicator && (
              <span className="pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 flex min-h-8 min-w-8 -translate-x-1/2 items-center justify-center rounded-full bg-inverse-surface px-2 text-xs font-medium text-inverse-on-surface">
                {current}
              </span>
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
