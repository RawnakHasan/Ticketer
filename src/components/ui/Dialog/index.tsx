import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import {
  dialogPopupVariants,
  dialogScrimClass,
  dialogSlots,
  dialogVariants,
} from "@/components/ui/Dialog/variant";

type DialogVariants = VariantProps<typeof dialogVariants>;

// Holds the open state. Use open/onOpenChange to control it, or defaultOpen.
// <Dialog>
//   <DialogTrigger>Open</DialogTrigger>
//   <DialogContent>
//     <DialogTitle /> <DialogDescription /> <DialogActions><DialogClose /></DialogActions>
//   </DialogContent>
// </Dialog>
function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props} />;
}

type DialogTriggerProps = Omit<DialogPrimitive.Trigger.Props, "className"> & {
  className?: string;
};

// A bare button: style it with buttonVariants, like the split button trigger
function DialogTrigger({ className, ...props }: DialogTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" className={className} {...props} />;
}

type DialogCloseProps = Omit<DialogPrimitive.Close.Props, "className"> & {
  className?: string;
};

// Closes the dialog. Use it for the actions (buttonVariants text) or the close icon.
function DialogClose({ className, ...props }: DialogCloseProps) {
  return <DialogPrimitive.Close data-slot="dialog-close" className={className} {...props} />;
}

type DialogContentProps = Omit<DialogPrimitive.Popup.Props, "className"> &
  Pick<DialogVariants, "variant"> & {
    className?: string;
  };

// The dialog itself, with the scrim behind it. Focus stays inside while it is open,
// Escape and a click on the scrim close it.
function DialogContent({ className, variant, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop data-slot="dialog-scrim" className={dialogScrimClass} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(dialogVariants({ variant }), dialogPopupVariants({ variant }), className)}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}

type SlotProps = Omit<ComponentProps<"div">, "className"> & { className?: string };

// Optional icon above the headline (24dp). It only decorates, the headline names the dialog.
function DialogIcon({ className, ...props }: SlotProps) {
  return (
    <div
      data-slot="dialog-icon"
      aria-hidden="true"
      className={cn(dialogSlots.icon, className)}
      {...props}
    />
  );
}

type DialogTitleProps = Omit<DialogPrimitive.Title.Props, "className"> & { className?: string };

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(dialogSlots.title, className)}
      {...props}
    />
  );
}

type DialogDescriptionProps = Omit<DialogPrimitive.Description.Props, "className"> & {
  className?: string;
};

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(dialogSlots.description, className)}
      {...props}
    />
  );
}

// Scrolling area for longer content, such as a list or a form
function DialogBody({ className, ...props }: SlotProps) {
  return <div data-slot="dialog-body" className={cn(dialogSlots.body, className)} {...props} />;
}

function DialogDivider({ className, ...props }: SlotProps) {
  return (
    <div
      data-slot="dialog-divider"
      role="separator"
      className={cn(dialogSlots.divider, className)}
      {...props}
    />
  );
}

// Buttons at the trailing edge, 8dp apart
function DialogActions({ className, ...props }: SlotProps) {
  return (
    <div data-slot="dialog-actions" className={cn(dialogSlots.actions, className)} {...props} />
  );
}

// Full-screen dialogs only: a close button, the headline, then a text button such as Save
function DialogHeader({ className, ...props }: SlotProps) {
  return <div data-slot="dialog-header" className={cn(dialogSlots.header, className)} {...props} />;
}

export {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogDivider,
  DialogHeader,
  DialogIcon,
  DialogTitle,
  DialogTrigger,
};
