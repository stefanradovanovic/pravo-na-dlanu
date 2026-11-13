import type { ComponentProps } from "react";
import { Input as InputPrimitive } from "@ui-sdk/react/input";
import { cn } from "cn";
function Input({ className, ...props }: ComponentProps<typeof InputPrimitive>) {
  return <InputPrimitive className={cn("ui-input", className)} {...props} />;
}
export { Input };
