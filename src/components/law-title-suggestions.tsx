import { normalizeSearch } from "@/lib/search";
import type { ComponentProps } from "react";
import type { SearchSnippet } from "@/lib/search-snippet";
import {
  AutocompleteContent,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/ui/autocomplete";

export type LawSuggestion = {
  title: string;
  href: string;
  snippet?: SearchSnippet;
};

export function LawSuggestions({
  matches,
  query,
  contentProps,
}: {
  matches: readonly LawSuggestion[];
  query: string;
  contentProps?: Pick<
    ComponentProps<typeof AutocompleteContent>,
    "align" | "className"
  >;
}) {
  const normalized = normalizeSearch(query);
  if (normalized.length < 3) return null;
  const laws = matches.slice(0, 6);
  if (!laws.length) return null;

  return (
    <AutocompleteContent {...contentProps}>
      <AutocompleteList>
        {laws.map(({ title, href, snippet }) => (
          <AutocompleteItem
            key={href}
            value={href}
            label={snippet ? `${title} · ${snippet.label}` : title}
            render={<a href={href} />}
          >
            {snippet ? (
              <span className="min-w-0">
                <span className="line-clamp-2 font-medium">{title}</span>
                <span className="block text-sm text-muted-foreground">
                  {snippet.label}
                </span>
                <span className="search-snippet line-clamp-2 text-sm">
                  {snippet.before}
                  <mark>{snippet.match}</mark>
                  {snippet.after}
                </span>
              </span>
            ) : (
              title
            )}
          </AutocompleteItem>
        ))}
      </AutocompleteList>
    </AutocompleteContent>
  );
}
