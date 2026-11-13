"use client";
import type { ComponentProps, ReactNode } from "react";
import * as Primitive from "@ui-sdk/react/select";
import { cn } from "cn";
import { ChevronDown, Check } from "lucide-react";

const Select = Primitive.Select;
const SelectGroup = Primitive.SelectGroup;
const SelectLabel = Primitive.SelectGroupLabel;
const SelectValue = Primitive.SelectValue;
const SelectSeparator = Primitive.SelectSeparator;
function SelectTrigger({
  className,
  children,
  size = "default",
  ...props
}: Omit<ComponentProps<typeof Primitive.SelectTrigger>, "children"> & {
  children?: ReactNode;
} & { size?: "sm" | "default" }) {
  return (
    <Primitive.SelectTrigger
      className={cn("ui-select-trigger", className)}
      data-size={size}
      {...props}
    >
      {children}
      <ChevronDown aria-hidden="true" />
    </Primitive.SelectTrigger>
  );
}
function SelectContent({
  className,
  sideOffset = 4,
  alignItemWithTrigger = true,
  ...props
}: ComponentProps<typeof Primitive.SelectContent>) {
  return (
    <Primitive.SelectContent
      className={cn("ui-select-content", className)}
      sideOffset={sideOffset}
      alignItemWithTrigger={alignItemWithTrigger}
      {...props}
    />
  );
}
function SelectItem({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Primitive.SelectItem>, "children"> & {
  children?: ReactNode;
}) {
  return (
    <Primitive.SelectItem
      className={cn("ui-select-item", className)}
      {...props}
    >
      <Primitive.SelectItemText>{children}</Primitive.SelectItemText>
      <Primitive.SelectItemIndicator className="ui-select-indicator">
        <Check aria-hidden="true" />
      </Primitive.SelectItemIndicator>
    </Primitive.SelectItem>
  );
}
export {
  Select,
  SelectGroup,
  SelectLabel,
  SelectValue,
  SelectSeparator,
  SelectTrigger,
  SelectContent,
  SelectItem,
};
