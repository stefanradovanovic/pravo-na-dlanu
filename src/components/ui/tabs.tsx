"use client";
import type { ComponentProps } from "react";
import * as Primitive from "@ui-sdk/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

function Tabs({
  className,
  ...props
}: ComponentProps<typeof Primitive.Tabs<string>>) {
  return <Primitive.Tabs className={cn("ui-tabs", className)} {...props} />;
}
const tabsListVariants = cva("ui-tabs-list", {
  variants: { variant: { default: "ui-tabs-segmented", line: "ui-tabs-line" } },
  defaultVariants: { variant: "default" },
});
function TabsList({
  className,
  variant,
  ...props
}: ComponentProps<typeof Primitive.TabsList> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <Primitive.TabsList
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}
function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof Primitive.TabsTab>) {
  return <Primitive.TabsTab className={cn("ui-tab", className)} {...props} />;
}
function TabsContent({
  className,
  ...props
}: ComponentProps<typeof Primitive.TabsPanel>) {
  return (
    <Primitive.TabsPanel className={cn("ui-tab-panel", className)} {...props} />
  );
}
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
