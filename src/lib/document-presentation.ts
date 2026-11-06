// Presentation only: the archived source and its wording remain unchanged.
// Match the registry title before joining paragraphs so introductory provisions
// and titles of later amendment texts cannot be mistaken for the document title.
export function normalizeDocumentTitle(
  markdown: string,
  title: string,
): string {
  const blocks = markdown.split(/\r?\n\s*\r?\n/);
  const comparable = (text: string) =>
    text.replace(/\s+/g, " ").trim().toLocaleLowerCase("sr");
  const start = blocks[0]?.trim() === "Редакцијски пречишћен текст" ? 1 : 0;
  for (let count = 1; count <= 4 && start + count <= blocks.length; count++) {
    const parts = blocks.slice(start, start + count);
    if (parts.some((part) => /[#<>*\[\]]/.test(part))) break;
    const joined = parts.join(" ").replace(/\s+/g, " ").trim();
    if (comparable(joined) === comparable(title)) {
      blocks.splice(start, count, `## ${joined}`);
      return blocks.join("\n\n");
    }
  }
  return markdown;
}
