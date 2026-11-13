import type { ComponentProps, ReactNode } from "react";
import * as Primitive from "@ui-sdk/react/accordion";
import { cn } from "cn";
import { ChevronDown } from "lucide-react";

function Accordion({
  className,
  ...props
}: ComponentProps<typeof Primitive.Accordion<string>>) {
  return (
    <Primitive.Accordion className={cn("ui-accordion", className)} {...props} />
  );
}
function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.AccordionItem>) {
  return (
    <Primitive.AccordionItem
      className={cn("ui-accordion-item", className)}
      {...props}
    />
  );
}
function AccordionTrigger({
  className,
  children,
  ...props
}: Omit<ComponentProps<typeof Primitive.AccordionTrigger>, "children"> & {
  children?: ReactNode;
}) {
  return (
    <Primitive.AccordionHeader>
      <Primitive.AccordionTrigger
        className={cn("ui-accordion-trigger", className)}
        {...props}
      >
        {children}
        <ChevronDown className="ui-accordion-chevron" aria-hidden="true" />
      </Primitive.AccordionTrigger>
    </Primitive.AccordionHeader>
  );
}
function AccordionContent({
  className,
  ...props
}: ComponentProps<typeof Primitive.AccordionPanel>) {
  return (
    <Primitive.AccordionPanel
      className={cn("ui-accordion-panel", className)}
      {...props}
    />
  );
}
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
