import { test } from "node:test";
import assert from "node:assert/strict";
import { articleHeadings } from "../src/lib/document-navigation";
import { articleNavigationEntries } from "../src/lib/article-navigation-entries";
import articleTopics from "../content/article-topics.json";
import { documentPassages } from "../scripts/document-passages";
import { findSearchSnippet } from "../src/lib/search-snippet";
import {
  documentUrl,
  explorerUrl,
  readExplorerState,
  safeReturnUrl,
} from "../src/lib/explorer-url";
import { getRegistry, getLawDocument } from "../src/lib/registry";

test("article fragments distinguish inserted articles and repeated amendment numbers", () => {
  const markdown =
    "## Члан 1.\n\nТекст\n\n## Члан 12а\n\nДруги\n\n## Члан 1.\n\nИзмена";
  assert.deepEqual(
    articleHeadings(markdown).map((h) => h.id),
    ["clan-1", "clan-12a", "clan-1-2"],
  );
  const passages = documentPassages(markdown);
  assert.equal(findSearchSnippet(passages, "izmena")?.anchor, "clan-1-2");
  assert.match(articleHeadings(markdown)[2].label, /2\. појављивање/);
});

test("article navigation uses official captions and short topics from each article", () => {
  const markdown = [
    "## Члан 1.",
    "Службени наслов",
    "## Члан 2.",
    "Текст са службеним насловом.",
    "## Члан 3.",
    "\\*Службени гласник РС, број 1/2026",
    "**Право на одмор** уређује се у складу са условима из овог закона и колективног уговора послодавца.",
    "## Члан 3.",
    "_Брисан је._",
    "## Члан 4.",
    "Службени гласник има основно издање и посебна издања.",
  ].join("\n\n");
  const entries = articleNavigationEntries(
    articleHeadings(markdown),
    markdown,
    {
      id: "test",
    },
  );
  assert.deepEqual(
    entries.map(({ id, subtitle }) => [id, subtitle]),
    [
      ["clan-1", "Текст одредбе"],
      ["clan-2", "Службени наслов"],
      ["clan-3", "Право на одмор"],
      ["clan-3-2", "Брисана одредба"],
      ["clan-4", "Основно издање и посебна издања"],
    ],
  );
});

test("footnoted article numbers get their own fragments without claiming established URLs", () => {
  const markdown = "Члан 1.\\*\n\nПрви текст.\n\n## Члан 1.\n\nДруги текст.";
  assert.deepEqual(
    articleHeadings(markdown).map((heading) => heading.id),
    ["clan-1-2", "clan-1"],
  );
  assert.equal(
    findSearchSnippet(documentPassages(markdown), "prvi")?.anchor,
    "clan-1-2",
  );
});

test("editorial topics point to articles in the pinned source text", () => {
  for (const [id, { textSha256, topics }] of Object.entries(articleTopics)) {
    const { record, markdown } = getLawDocument(id)!;
    const headings = articleHeadings(markdown);
    assert.equal(record.textSha256, textSha256, id);
    const entries = articleNavigationEntries(headings, markdown, record);
    const stale = articleNavigationEntries(headings, markdown, {
      id,
      textSha256: "changed-source",
    });
    for (const [anchor, topic] of Object.entries(topics)) {
      assert.equal(
        entries.find((heading) => heading.id === anchor)?.subtitle,
        topic,
      );
      assert.notEqual(
        stale.find((heading) => heading.id === anchor)?.subtitle,
        topic,
      );
    }
  }
});

test("snippets preserve Cyrillic and map expanded letters back to original offsets", () => {
  const passages = documentPassages(
    "## Члан 12.\n\nПраво на **годишњи одмор** припада Ђорђу и Љиљани.\n\n[Извор](https://example.com)",
  );
  for (const query of ["годишњи одмор", "godišnji odmor", "godisnji odmor"]) {
    const snippet = findSearchSnippet(passages, query)!;
    assert.equal(snippet.match, "годишњи одмор");
    assert.equal(snippet.anchor, "clan-12");
    assert.ok(snippet.before.endsWith("Право на "));
  }
  assert.equal(
    findSearchSnippet(passages, "djordju i ljiljani")?.match,
    "Ђорђу и Љиљани",
  );
  assert.equal(findSearchSnippet(passages, "https"), null);
  assert.equal(findSearchSnippet(passages, ""), null);
});

test("table text and preambles remain searchable without exposing markup", () => {
  const passages = documentPassages(
    "Уводни текст\n\n## Члан 2.\n\n<table><tr><td>Право</td><td>грађана</td></tr></table>",
  );
  assert.equal(findSearchSnippet(passages, "uvodni")?.anchor, "tekst-zakona");
  const snippet = findSearchSnippet(passages, "pravo gradjana")!;
  assert.equal(snippet.match, "Право грађана");
  assert.equal(snippet.anchor, "clan-2");
});

test("snippets match word prefixes rather than the middle of unrelated words", () => {
  const passages = documentPassages(
    "## Члан 1.\n\nГрадски радници имају права.",
  );
  assert.equal(findSearchSnippet(passages, "rad")?.match, "рад");
  assert.ok(findSearchSnippet(passages, "rad")?.before.endsWith("Градски "));
});

test("large table passages retain correct offsets near the end of the text", () => {
  const text = "Табела 1. ".repeat(50_000) + "Санитарни надзор 255.466.000";
  const snippet = findSearchSnippet(
    [{ anchor: "clan-4", label: "Члан 4.", text }],
    "sanitarni nadzor",
  );
  assert.equal(snippet?.match, "Санитарни надзор");
  assert.equal(snippet?.anchor, "clan-4");
  assert.ok(snippet?.before.startsWith("…"));
});

test("search URL round trips all controls and safely carries reader return context", () => {
  const state = {
    query: "годишњи одмор",
    category: "I УСТАВ",
    view: "list",
    mode: "full",
    page: 3,
  };
  const url = explorerUrl(state);
  assert.deepEqual(readExplorerState(url.slice(1)), state);
  const document = new URL(
    documentUrl("/propisi/test", url, "clan-12"),
    "https://example.com",
  );
  assert.equal(safeReturnUrl(document.searchParams.get("returnTo")), url);
  assert.equal(document.hash, "#clan-12");
  for (const invalid of [
    "//evil.example",
    "https://evil.example",
    "/propisi/test",
    "javascript:alert(1)",
  ])
    assert.equal(safeReturnUrl(invalid), "/");
  for (const page of ["-1", "NaN", "Infinity", "1.5", "9007199254740992"])
    assert.equal(readExplorerState(`?page=${page}`).page, 0);
  assert.equal(readExplorerState("?view=invalid&mode=invalid").view, "map");
});

test("every corpus article has a unique fragment and a matching search passage", () => {
  for (const record of getRegistry().records) {
    if (record.textStatus !== "complete") continue;
    const markdown = getLawDocument(record.id)!.markdown;
    const headings = articleHeadings(markdown);
    assert.equal(
      new Set(headings.map((h) => h.id)).size,
      headings.length,
      record.id,
    );
    const passages = documentPassages(markdown);
    const anchors = new Set(passages.map((passage) => passage.anchor));
    for (const heading of headings)
      assert.ok(anchors.has(heading.id), `${record.id}#${heading.id}`);
  }
});
