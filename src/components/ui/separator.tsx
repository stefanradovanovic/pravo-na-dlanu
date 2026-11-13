import type { ComponentProps } from "react";
import { Separator as SeparatorPrimitive } from "@ui-sdk/react/separator";
import { cn } from "cn";
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: ComponentProps<typeof SeparatorPrimitive>) {
  return (
    <SeparatorPrimitive
      orientation={orientation}
      decorative={decorative}
      className={cn("ui-separator", className)}
      {...props}
    />
  );
}
export { Separator };
