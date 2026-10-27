import type { ComponentProps, KeyboardEvent } from "react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { cardVariants } from "@/components/ui/Card/variant";

type CardVariants = VariantProps<typeof cardVariants>;

type CardProps = Omit<ComponentProps<"div">, "className"> &
  Pick<CardVariants, "variant"> & {
    className?: string;
    // Makes the whole card pressable. Defaults to true when onClick is set.
    // An interactive card is a single control, so don't put buttons or links inside it.
    interactive?: boolean;
    disabled?: boolean;
    // Show the dragged state (lifted, strongest state layer), for cards being moved around
    dragged?: boolean;
  };

function Card({
  className,
  variant,
  interactive,
  disabled,
  dragged,
  onClick,
  onKeyDown,
  ...props
}: CardProps) {
  const isInteractive = interactive ?? onClick !== undefined;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (!isInteractive || disabled || event.defaultPrevented) return;
    // Only react to keys on the card itself, not on something inside it
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  }

  return (
    <div
      data-slot="card"
      data-disabled={disabled ? "" : undefined}
      data-dragged={dragged ? "" : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive && !disabled ? 0 : undefined}
      aria-disabled={isInteractive && disabled ? true : undefined}
      className={cn(cardVariants({ variant, interactive: isInteractive }), className)}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

type SlotProps = Omit<ComponentProps<"div">, "className"> & { className?: string };

// Full-width image, video or placeholder at the top (or anywhere) in the card
function CardMedia({ className, ...props }: SlotProps) {
  return (
    <div
      data-slot="card-media"
      className={cn(
        "flex aspect-video w-full items-center justify-center bg-surface-variant text-on-surface-variant",
        "[&>img]:size-full [&>img]:object-cover [&_svg]:size-10",
        className,
      )}
      {...props}
    />
  );
}

// Row for an avatar, icon or menu button. Put leading content first and trailing content last.
function CardHeader({ className, ...props }: SlotProps) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-start justify-between gap-4 px-4 pt-4 last:pb-4", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: ComponentProps<"p"> & { className?: string }) {
  return (
    <p
      data-slot="card-title"
      className={cn("px-4 pt-3 text-2xl leading-8 text-on-surface first:pt-4 last:pb-4", className)}
      {...props}
    />
  );
}

function CardSubhead({ className, ...props }: ComponentProps<"p"> & { className?: string }) {
  return (
    <p
      data-slot="card-subhead"
      className={cn("px-4 text-sm leading-5 text-on-surface-variant last:pb-4", className)}
      {...props}
    />
  );
}

// Supporting text
function CardContent({ className, ...props }: SlotProps) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-4 text-sm leading-5 text-on-surface-variant", className)}
      {...props}
    />
  );
}

// Buttons at the end of the card, aligned to the trailing edge
function CardActions({ className, ...props }: SlotProps) {
  return (
    <div
      data-slot="card-actions"
      className={cn("flex items-center justify-end gap-2 p-4", className)}
      {...props}
    />
  );
}

export { Card, CardActions, CardContent, CardHeader, CardMedia, CardSubhead, CardTitle };
