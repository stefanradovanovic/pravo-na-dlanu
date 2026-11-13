"use client";
import type { ComponentProps } from "react";
import * as Primitive from "@ui-sdk/react/tooltip";
import { cn } from "cn";
const Tooltip = Primitive.Tooltip;
const TooltipTrigger = Primitive.TooltipTrigger;
function TooltipContent({
  className,
  side = "top",
  sideOffset = 8,
  ...props
}: ComponentProps<typeof Primitive.TooltipContent>) {
  return (
    <Primitive.TooltipContent
      side={side}
      sideOffset={sideOffset}
      className={cn("ui-tooltip", className)}
      {...props}
    />
  );
}
export { Tooltip, TooltipTrigger, TooltipContent };
