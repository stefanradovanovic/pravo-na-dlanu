import { normalizeSearch } from "./search";
import { isArticleSubtitle } from "./article-subtitles";

export type ArticleHeading = {
  id: string;
  label: string;
  line: number;
  subtitle?: string;
};

// Source headings remain untouched. Repeated numbers (e.g. amendment texts)
// receive occurrence suffixes rather than sharing an ambiguous fragment.
export function articleHeadings(markdown: string): ArticleHeading[] {
  const occurrences = new Map<string, number>();
  const lines = markdown.split(/\r?\n/);
  return lines.flatMap((line, index) => {
    const match = /^##\s+(Члан\s+(\d+\s*[а-яђјљњћџa-z]?)\.?)\s*$/iu.exec(line);
    if (!match) return [];
    const base = `clan-${normalizeSearch(match[2]).replaceAll(" ", "")}`;
    const count = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, count);
    let end = index - 1;
    while (end >= 0 && !lines[end].trim()) end--;
    let start = end;
    while (start >= 0 && lines[start].trim()) start--;
    const caption = lines.slice(start + 1, end + 1).join("\n");
    return [
      {
        id: count === 1 ? base : `${base}-${count}`,
        label: match[1] + (count > 1 ? ` (${count}. појављивање)` : ""),
        line: index + 1,
        ...(isArticleSubtitle(caption) ? { subtitle: caption } : {}),
      },
    ];
  });
}
