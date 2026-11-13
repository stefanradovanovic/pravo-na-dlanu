import type { ComponentProps } from "react";
import { Button as ButtonPrimitive } from "@ui-sdk/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva("ui-button", {
  variants: {
    variant: {
      default: "ui-button-primary",
      outline: "ui-button-outline",
      secondary: "ui-button-secondary",
      ghost: "ui-button-ghost",
      destructive: "ui-button-destructive",
      link: "ui-button-link",
    },
    size: {
      default: "ui-button-default",
      xs: "ui-button-xs",
      sm: "ui-button-sm",
      lg: "ui-button-lg",
      icon: "ui-button-icon",
      "icon-xs": "ui-button-icon-xs",
      "icon-sm": "ui-button-icon-sm",
      "icon-lg": "ui-button-icon-lg",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

function Button({
  className,
  variant,
  size,
  ...props
}: Omit<ComponentProps<typeof ButtonPrimitive>, "className"> &
  VariantProps<typeof buttonVariants> & { className?: string }) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
export { Button, buttonVariants };
