import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeDocumentTitle } from "../src/lib/document-presentation";
import { articleHeadings } from "../src/lib/document-navigation";
import { getLawDocument } from "../src/lib/registry";

test("water law title is one heading, preserving all source words and article anchors", () => {
  const { markdown, record } = getLawDocument(
    "54547db1-244d-4570-a6a5-3a9a56470dfd",
  )!;
  const formatted = normalizeDocumentTitle(markdown, record.title);
  assert.match(formatted, /## ЗАКОН о водама\n/);
  assert.equal(
    formatted.replace(/^## /gm, "").replace(/\s+/g, " "),
    markdown.replace(/^## /gm, "").replace(/\s+/g, " "),
  );
  assert.deepEqual(
    articleHeadings(formatted).map(({ id }) => id),
    articleHeadings(markdown).map(({ id }) => id),
  );
  assert.equal(normalizeDocumentTitle(formatted, record.title), formatted);
});

test("only a matching opening title is normalized", () => {
  const body = "ЗАКОН\n\nо нечем другом\n\n## Члан 1.\n\nЗАКОН\n\nо водама";
  assert.equal(normalizeDocumentTitle(body, "Закон о водама"), body);
  assert.equal(
    normalizeDocumentTitle(
      "ЗАКОН\n\nо\n\nводама\n\n## Члан 1.",
      "Закон о водама",
    ),
    "## ЗАКОН о водама\n\n## Члан 1.",
  );
});
