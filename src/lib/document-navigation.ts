import { normalizeSearch } from "./search";
import { isArticleSubtitle } from "./article-subtitles";

export type ArticleHeading = {
  id: string;
  label: string;
  line: number;
  subtitle?: string;
  section?: string;
};

// Source headings remain untouched. Repeated numbers (e.g. amendment texts)
// receive occurrence suffixes rather than sharing an ambiguous fragment.
export function articleHeadings(markdown: string): ArticleHeading[] {
  const occurrences = new Map<string, number>();
  let section: string | undefined;
  const lines = markdown.split(/\r?\n/);
  return lines.flatMap((line, index) => {
    const plain = line.trim().replaceAll("\\.", ".");
    // Only explicit, short source section headings become navigation labels.
    if (
      plain.length <= 160 &&
      /^(?:[IVXLCDMХСМ]+[а-яђјљњћџa-z]?\.?\s+|(?:ДЕО|ГЛАВА|ОДЕЉАК|Део|Глава|Одељак)\s+|ОДРЕДБЕ КОЈЕ НИСУ УНЕТЕ)/u.test(
        plain,
      ) &&
      !/[;:!?]$/.test(plain)
    )
      section = plain;
    const match = /^##\s+(Члан\s+(\d+\s*[а-яђјљњћџa-z]?)\.?)\s*$/iu.exec(line);
    if (!match) return [];
    let previous = index - 1;
    while (previous >= 0 && !lines[previous].trim()) previous--;
    const caption = lines[previous]?.trim();
    const subtitle =
      caption &&
      (previous === 0 || !lines[previous - 1].trim()) &&
      isArticleSubtitle(caption)
        ? caption
        : undefined;
    const base = `clan-${normalizeSearch(match[2]).replaceAll(" ", "")}`;
    const count = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, count);
    return [
      {
        id: count === 1 ? base : `${base}-${count}`,
        label: match[1] + (count > 1 ? ` (${count}. појављивање)` : ""),
        line: index + 1,
        ...(subtitle ? { subtitle } : {}),
        ...(section ? { section } : {}),
      },
    ];
  });
}

export function filterArticleHeadings(
  headings: ArticleHeading[],
  query: string,
  body: ReadonlyMap<string, string> = new Map(),
) {
  const normalized = normalizeSearch(query);
  const number = normalized.replace(/^clan\s*/, "").replaceAll(" ", "");
  if (!normalized) return headings;
  if (/^\d+[a-z]*$/.test(number))
    return headings.filter((heading) => heading.id.split("-")[1] === number);
  const words = normalized.split(" ");
  return headings.filter((heading) => {
    const text = ` ${normalizeSearch(`${heading.label} ${heading.subtitle ?? ""} ${heading.section ?? ""}`)} ${body.get(heading.id) ?? ""}`;
    return words.every((word) => text.includes(` ${word}`));
  });
}
