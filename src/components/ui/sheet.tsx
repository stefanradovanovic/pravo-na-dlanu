"use client";
import type { ComponentProps, ReactNode } from "react";
import * as Primitive from "@ui-sdk/react/dialog";
import { cn } from "cn";
import { X } from "lucide-react";
import { buttonVariants } from "./button";
import {
  DialogHeader as SheetHeader,
  DialogFooter as SheetFooter,
  DialogTitle as SheetTitle,
  DialogDescription as SheetDescription,
} from "./dialog";

const Sheet = Primitive.Dialog;
const SheetTrigger = Primitive.DialogTrigger;
const SheetClose = Primitive.DialogClose;
function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: Omit<ComponentProps<typeof Primitive.DialogContent>, "children"> & {
  children?: ReactNode;
} & { side?: "top" | "right" | "bottom" | "left"; showCloseButton?: boolean }) {
  return (
    <>
      <Primitive.DialogBackdrop className="ui-overlay" />
      <Primitive.DialogContent
        className={cn("ui-sheet", className)}
        data-side={side}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetClose
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "ui-dialog-close",
            )}
            aria-label="Затвори"
          >
            <X />
          </SheetClose>
        )}
      </Primitive.DialogContent>
    </>
  );
}
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
