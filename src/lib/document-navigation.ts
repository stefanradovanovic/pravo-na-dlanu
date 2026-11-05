import { normalizeSearch } from "./search";

export type ArticleHeading = { id: string; label: string; line: number };

// Source headings remain untouched. Repeated numbers (e.g. amendment texts)
// receive occurrence suffixes rather than sharing an ambiguous fragment.
export function articleHeadings(markdown: string): ArticleHeading[] {
  const occurrences = new Map<string, number>();
  return markdown.split(/\r?\n/).flatMap((line, index) => {
    const match = /^##\s+(Члан\s+(\d+\s*[а-яђјљњћџa-z]?)\.?)\s*$/iu.exec(line);
    if (!match) return [];
    const base = `clan-${normalizeSearch(match[2]).replaceAll(" ", "")}`;
    const count = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, count);
    return [
      {
        id: count === 1 ? base : `${base}-${count}`,
        label: match[1] + (count > 1 ? ` (${count}. појављивање)` : ""),
        line: index + 1,
      },
    ];
  });
}
