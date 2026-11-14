import { normalizeSearch } from "@/lib/search";
import {
  AutocompleteContent,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/ui/autocomplete";

export type LawSuggestion = { title: string; href: string };

export function LawSuggestions({
  matches,
  query,
}: {
  matches: readonly LawSuggestion[];
  query: string;
}) {
  const normalized = normalizeSearch(query);
  if (normalized.length < 3) return null;
  const laws = matches.slice(0, 6);
  if (!laws.length) return null;

  return (
    <AutocompleteContent>
      <AutocompleteList>
        {laws.map(({ title, href }) => (
          <AutocompleteItem
            key={href}
            value={href}
            label={title}
            render={<a href={href} />}
          >
            {title}
          </AutocompleteItem>
        ))}
      </AutocompleteList>
    </AutocompleteContent>
  );
}
