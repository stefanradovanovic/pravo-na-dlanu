import { normalizeSearch } from "./search";
import { isArticleSubtitle } from "./article-subtitles";

export type ArticleHeading = {
  id: string;
  label: string;
  line: number;
  subtitle?: string;
};

const numberedArticle =
  /^(?:#{1,2}\s+)?[*_]*(Члан\s+(\d+(?:\\?-\d+|\.\d+|\s*[а-яђјљњћџa-z])?)\.?)[*_\\\s]*$/iu;
const existingAnchor = /^##\s+Члан\s+\d+\s*[а-яђјљњћџa-z]?\.?\s*$/iu;

export function normalizeArticleHeadings(markdown: string): string {
  return markdown
    .split(/\r?\n/u)
    .map((line) => {
      const heading = line.trim();
      if (!numberedArticle.test(heading)) return line;
      if (/^##\s/u.test(heading)) return heading;
      return `## ${heading.replace(/^#\s+/u, "")}`;
    })
    .join("\n");
}

// Source headings remain untouched. Repeated numbers (e.g. amendment texts)
// receive occurrence suffixes rather than sharing an ambiguous fragment.
export function articleHeadings(markdown: string): ArticleHeading[] {
  const occurrences = new Map<string, number>();
  const reserved = new Map<string, number>();
  const lines = markdown.split(/\r?\n/);
  const articles = lines.flatMap((line, index) => {
    const match = numberedArticle.exec(line.trim());
    if (!match) return [];
    const number = /^[\d.]+$/u.test(match[2])
      ? match[2]
      : normalizeSearch(match[2].replaceAll("-", " до ")).replaceAll(" ", "");
    const base = `clan-${number}`;
    const established = existingAnchor.test(line);
    if (established) reserved.set(base, (reserved.get(base) ?? 0) + 1);
    return [{ index, base, label: match[1].replaceAll("\\", ""), established }];
  });
  return articles.map(({ index, base, label, established }) => {
    // Newly recognized headings must not take fragments already used in links.
    const counts = established ? occurrences : reserved;
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    let end = index - 1;
    while (end >= 0 && !lines[end].trim()) end--;
    let start = end;
    while (start >= 0 && lines[start].trim()) start--;
    const caption = lines.slice(start + 1, end + 1).join("\n");
    return {
      id: count === 1 ? base : `${base}-${count}`,
      label: label + (count > 1 ? ` (${count}. појављивање)` : ""),
      line: index + 1,
      ...(isArticleSubtitle(caption) ? { subtitle: caption } : {}),
    };
  });
}
