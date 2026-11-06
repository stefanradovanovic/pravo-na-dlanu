import type { Root } from "mdast";

// PIS exports article captions as plain paragraphs before the article number.
// Move only short, plain caption-like blocks; leave numbered sections, source
// notes, formatted blocks and sentence punctuation in their original position.
// The original Markdown and heading positions (used for anchors) are unchanged.
export function remarkArticleSubtitles() {
  return (tree: Root) => {
    for (let index = 1; index < tree.children.length; index++) {
      const heading = tree.children[index];
      const caption = tree.children[index - 1];
      if (
        heading.type !== "heading" ||
        heading.depth !== 2 ||
        heading.children.length !== 1 ||
        heading.children[0].type !== "text" ||
        !/^Члан\s+\d+\s*[а-яђјљњћџa-z]?\.?$/iu.test(
          heading.children[0].value,
        ) ||
        caption.type !== "paragraph" ||
        caption.children.length !== 1 ||
        caption.children[0].type !== "text"
      )
        continue;
      const text = caption.children[0].value;
      if (
        text.length > 120 ||
        text.split(/\s+/).length > 16 ||
        !/^[А-ЯЂЈЉЊЋЏ][а-яђјљњћџА-ЯЂЈЉЊЋЏ ,–—-]*[а-яђјљњћџ]$/u.test(text) ||
        /^(Део|Глава|Одељак|Пододељак|Одсек|Редакцијски)(?:\s|$)/u.test(text)
      )
        continue;
      heading.children.push({
        type: "emphasis",
        data: { hName: "span", hProperties: { className: ["article-subtitle"] } },
        children: [{ type: "text", value: ` — ${text}` }],
      });
      tree.children.splice(index - 1, 1);
      index--;
    }
  };
}
