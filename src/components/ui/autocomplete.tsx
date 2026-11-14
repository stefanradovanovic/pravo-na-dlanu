"use client";

import type { ComponentProps } from "react";
import * as Primitive from "@ui-sdk/react/autocomplete";
import { cn } from "cn";

function Autocomplete(props: ComponentProps<typeof Primitive.Autocomplete>) {
  return (
    <Primitive.Autocomplete
      announcement={(change) =>
        change.type === "results" && change.count
          ? `Предложени прописи: ${change.count}.`
          : null
      }
      {...props}
    />
  );
}
const AutocompleteList = Primitive.AutocompleteList;

function AutocompleteInput({
  className,
  ...props
}: ComponentProps<typeof Primitive.AutocompleteInput>) {
  return (
    <Primitive.AutocompleteInput
      className={cn("ui-input", className)}
      {...props}
    />
  );
}

function AutocompleteContent(
  props: ComponentProps<typeof Primitive.AutocompleteContent>,
) {
  return (
    <Primitive.AutocompleteContent
      sideOffset={4}
      {...props}
      className={cn("ui-autocomplete-content", props.className)}
    />
  );
}

function AutocompleteItem(
  props: ComponentProps<typeof Primitive.AutocompleteItem>,
) {
  return (
    <Primitive.AutocompleteItem
      {...props}
      className={cn("ui-autocomplete-item", props.className)}
    />
  );
}

export {
  Autocomplete,
  AutocompleteInput,
  AutocompleteContent,
  AutocompleteList,
  AutocompleteItem,
};
