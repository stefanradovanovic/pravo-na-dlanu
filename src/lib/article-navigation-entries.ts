import type { PhrasingContent } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import articleTopics from "../../content/article-topics.json";
import { isArticleSubtitle } from "./article-subtitles";
import { articleTopicLabel } from "./article-topic-label";
import type { ArticleHeading } from "./document-navigation";
import type { RegistryRecord } from "./registry-types";

const topicsByLaw: Record<
  string,
  { textSha256: string; topics: Record<string, string> }
> = articleTopics;
const parser = unified().use(remarkParse);
const sourceNote =
  /^(?:[*†]+\s*)?(?:Напомена:|Напомена издавача(?:[:\s]|$)|Службени (?:гласник|лист) (?:РС|СРС|СРЈ|СЦГ|Републике Србије),\s*број\s|(?:Брисан је|Престао је да важи)\s+ранији\s+став)/iu;

export type ArticleNavigationEntry = Pick<ArticleHeading, "id" | "label"> & {
  subtitle: string;
};

function inlineText(node: PhrasingContent): string {
  if (node.type === "text" || node.type === "inlineCode") return node.value;
  if (node.type === "break") return " ";
  return "children" in node ? node.children.map(inlineText).join("") : "";
}

function articleOpening(lines: string[], start: number, end: number) {
  const paragraphs: string[] = [];
  while (start < end && paragraphs.length < 2) {
    if (!lines[start].trim()) {
      start++;
      continue;
    }
    let blockEnd = start + 1;
    while (blockEnd < end && lines[blockEnd].trim()) blockEnd++;
    const first = parser.parse(lines.slice(start, blockEnd).join("\n"))
      .children[0];
    const paragraph =
      first?.type === "list" ? first.children[0]?.children[0] : first;
    if (paragraph?.type !== "paragraph") break;

    const text = paragraph.children
      .map(inlineText)
      .join("")
      .replace(/\s+/gu, " ")
      .trim();
    start = blockEnd;
    if (!sourceNote.test(text) && /\p{Script=Cyrillic}/u.test(text))
      paragraphs.push(text.slice(0, 400));
  }
  return paragraphs.join("\n");
}

function precedingCaption(lines: string[], line: number) {
  let index = line - 2;
  while (index >= 0) {
    const text = lines[index].trim();
    if (!text || sourceNote.test(text.replace(/^[*_\\]+/u, ""))) {
      index--;
      continue;
    }
    if (lines[index - 1]?.trim()) return undefined;
    const caption = text
      .replace(/(?:\\\*)+$/u, "")
      .replace(/^([_*]+)(.+)\1$/u, "$2")
      .replace(/(?:\\\*)+$/u, "");
    if (text !== caption && isArticleSubtitle(caption))
      return { caption, index };
    return undefined;
  }
}

export function articleNavigationEntries(
  headings: ArticleHeading[],
  markdown: string,
  record: Pick<RegistryRecord, "id" | "textSha256">,
): ArticleNavigationEntry[] {
  const editorial = topicsByLaw[record.id];
  const topics =
    editorial && editorial.textSha256 === record.textSha256
      ? editorial.topics
      : undefined;
  const lines = markdown.split(/\r?\n/);
  const captions = headings.map((heading) =>
    precedingCaption(lines, heading.line),
  );

  return headings.map((heading, index) => {
    const { id, label, line } = heading;
    const subtitle =
      topics?.[id] ?? heading.subtitle ?? captions[index]?.caption;
    if (subtitle) return { id, label, subtitle };

    const next = headings[index + 1];
    let end =
      captions[index + 1]?.index ?? (next ? next.line - 1 : lines.length);
    // The next caption belongs to the next article even if this one has no body.
    if (next?.subtitle && !captions[index + 1]) {
      while (end > line && !lines[end - 1].trim()) end--;
      if (end > line) end--;
    }
    return {
      id,
      label,
      subtitle: articleTopicLabel(articleOpening(lines, line, end)),
    };
  });
}
