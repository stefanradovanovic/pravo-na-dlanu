import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { load } from "cheerio";
import { articleHeadings } from "../src/lib/document-navigation";
import type { SearchPassage } from "../src/lib/search-snippet";

type TextNode = {
  type: string;
  value?: string;
  children?: TextNode[];
  position?: { start: { line: number } };
};
function plainText(node: TextNode): string {
  if (node.type === "html") {
    const $ = load(node.value ?? "");
    $("script, style").remove();
    $("td, th, p, br").append(" ");
    return $.root().text();
  }
  if (node.value !== undefined) return node.value;
  return (node.children ?? [])
    .map(plainText)
    .join(
      ["table", "tableRow", "list", "listItem"].includes(node.type) ? " " : "",
    );
}
export function documentPassages(markdown: string): SearchPassage[] {
  const headings = new Map(
    articleHeadings(markdown).map((heading) => [heading.line, heading]),
  );
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const passages: SearchPassage[] = [
    { anchor: "tekst-zakona", label: "Уводни текст", text: "" },
  ];
  for (const node of tree.children) {
    const heading = headings.get(node.position?.start.line ?? -1);
    if (heading && node.type === "heading")
      passages.push({ anchor: heading.id, label: heading.label, text: "" });
    const current = passages[passages.length - 1];
    current.text += ` ${plainText(node).replace(/\s+/gu, " ").trim()}`;
  }
  return passages
    .map((passage) => ({ ...passage, text: passage.text.trim() }))
    .filter((passage) => passage.text);
}
