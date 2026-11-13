"use client";
import type { ComponentProps, ReactNode } from "react";
import * as Primitive from "@ui-sdk/react/dialog";
import { cn } from "cn";
import { X } from "lucide-react";
import { buttonVariants } from "./button";

const Dialog = Primitive.Dialog;
const DialogTrigger = Primitive.DialogTrigger;
const DialogClose = Primitive.DialogClose;
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: Omit<ComponentProps<typeof Primitive.DialogContent>, "children"> & {
  children?: ReactNode;
} & { showCloseButton?: boolean }) {
  return (
    <>
      <Primitive.DialogBackdrop className="ui-overlay" />
      <Primitive.DialogContent
        className={cn("ui-dialog", className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Primitive.DialogClose
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "ui-dialog-close",
            )}
            aria-label="Затвори"
          >
            <X />
          </Primitive.DialogClose>
        )}
      </Primitive.DialogContent>
    </>
  );
}
function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("ui-dialog-header", className)} {...props} />;
}
function DialogFooter({
  className,
  children,
  showCloseButton = false,
  ...props
}: ComponentProps<"div"> & { showCloseButton?: boolean }) {
  return (
    <div className={cn("ui-dialog-footer", className)} {...props}>
      {children}
      {showCloseButton && (
        <DialogClose className={buttonVariants({ variant: "outline" })}>
          Затвори
        </DialogClose>
      )}
    </div>
  );
}
function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof Primitive.DialogTitle>) {
  return (
    <Primitive.DialogTitle
      className={cn("ui-dialog-title", className)}
      {...props}
    />
  );
}
function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof Primitive.DialogDescription>) {
  return (
    <Primitive.DialogDescription
      className={cn("ui-dialog-description", className)}
      {...props}
    />
  );
}
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
