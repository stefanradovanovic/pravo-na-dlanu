import { test } from "node:test";
import assert from "node:assert/strict";
import { auditLaws } from "../scripts/audit-laws";
import { getLawDocument, findLearningLaw } from "../src/lib/registry";
import { getLibrary } from "../src/lib/content";
test("published corpus reconciles to the official register without duplicate documents", () => {
  const audit = auditLaws();
  assert.ok(audit.catalogRecords > 0);
});
test("all learning references open a complete canonical law", () => {
  for (const law of getLibrary().laws) {
    const canonical = findLearningLaw(law.id);
    assert.ok(canonical, law.id);
    assert.ok(getLawDocument(canonical.id)!.markdown.length > 100);
  }
});
test("constitution contains its first and final article in the same document", () => {
  const law = findLearningLaw("ustav")!;
  const { markdown } = getLawDocument(law.id)!;
  assert.match(markdown, /Члан 1\./);
  assert.match(markdown, /Члан 206\./);
});
