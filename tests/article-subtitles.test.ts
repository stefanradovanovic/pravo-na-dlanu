import { test } from "node:test";
import assert from "node:assert/strict";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { remarkArticleSubtitles } from "../src/lib/article-subtitles";
import { findLearningLaw, getLawDocument } from "../src/lib/registry";

const parser = unified().use(remarkParse);
test("constitution captions belong to the following article, with source anchors preserved", () => {
  const { markdown } = getLawDocument(findLearningLaw("ustav")!.id)!;
  const tree = parser.parse(markdown);
  const before = tree.children
    .filter((node) => node.type === "heading")
    .map((node) => node.position);
  remarkArticleSubtitles()(tree);
  const headings = tree.children.filter((node) => node.type === "heading");
  assert.deepEqual(
    headings.map((node) => node.position),
    before,
  );
  for (const [index, caption] of [
    "Република Србија",
    "Носиоци суверености",
    "Владавина права",
  ].entries()) {
    const subtitle = headings[index].children[1];
    assert.equal(subtitle.type, "emphasis");
    if (subtitle.type === "emphasis")
      assert.deepEqual(subtitle.children, [
        { type: "text", value: ` — ${caption}` },
      ]);
    assert.ok(
      !tree.children.some(
        (node) =>
          node.type === "paragraph" &&
          node.children[0]?.type === "text" &&
          node.children[0].value === caption,
      ),
    );
  }
});

test("sentences, section headings, tables and notes are not article captions", () => {
  for (const prefix of [
    "Одредба остаје на снази.",
    "I. ОСНОВНЕ ОДРЕДБЕ",
    "ОСНОВНЕ ОДРЕДБЕ",
    "Глава прва",
    "Редакцијски пречишћен текст",
    "**Напомена**",
    "<table><tr><td>Текст</td></tr></table>",
  ]) {
    const tree = parser.parse(`${prefix}\n\n## Члан 2.\n\nТекст члана.`);
    const before = structuredClone(tree);
    remarkArticleSubtitles()(tree);
    assert.deepEqual(tree, before, prefix);
  }
});
