import { load } from "cheerio";
import TurndownService from "turndown";
import { createHash } from "node:crypto";
export const sha256 = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
export function convertLegalHtml(html: string, contentUrl: string) {
  const $ = load(html);
  $("head,script,style,noscript,iframe").remove();
  const body = $("body"),
    plain = body.text().replace(/\s+/g, " ").trim();
  if (
    plain.length < 80 ||
    /Morate biti ulogovani|Access Denied|Just a moment|Dokument ne moze biti prikazan/i.test(
      plain,
    )
  )
    throw new Error("Missing or blocked legal text");
  $("a[href]").each((_, el) => {
    const a = $(el);
    try {
      const u = new URL(a.attr("href")!, contentUrl);
      if (["https:", "http:"].includes(u.protocol)) a.attr("href", u.href);
      else a.removeAttr("href");
    } catch {
      a.removeAttr("href");
    }
  });
  $("img[src]").each((_, el) => {
    const img = $(el);
    try {
      img.attr("src", new URL(img.attr("src")!, contentUrl).href);
    } catch {
      img.remove();
    }
  });
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });
  // Keep merged cells and complex legal schedules; simple Markdown tables lose structure.
  service.keep(["table", "sup", "sub"]);
  service.addRule("article-headings", {
    filter: (node) =>
      node.nodeName === "P" &&
      /^Члан\s+\d+[а-яa-z]?\.?$/i.test(node.textContent?.trim() ?? ""),
    replacement: (_content, node) =>
      "\n\n## " + node.textContent?.trim() + "\n\n",
  });
  const markdown = service
    .turndown(body.html() ?? "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (markdown.length < plain.length * 0.8)
    throw new Error("Conversion lost too much source text");
  return {
    markdown,
    characters: plain.length,
    hasTables: $("table").length > 0,
    hasImages: $("img").length > 0,
    textSha256: sha256(plain),
  };
}
export function duplicateGroups<T>(records: T[], key: (r: T) => string): T[][] {
  const groups = new Map<string, T[]>();
  for (const record of records) {
    const value = key(record);
    if (value) groups.set(value, [...(groups.get(value) ?? []), record]);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}
