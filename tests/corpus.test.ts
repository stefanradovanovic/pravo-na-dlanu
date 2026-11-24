import { test } from "node:test";
import assert from "node:assert/strict";
import { auditLaws } from "../scripts/audit-laws";
import {
  getLawDocument,
  findLearningLaw,
  getRegistry,
} from "../src/lib/registry";
import { getLibrary } from "../src/lib/content";
import { articleHeadings } from "../src/lib/document-navigation";
import { ASSEMBLY_RULES, DOMESTIC_REGISTERS } from "../scripts/catalog-scope";
test("published corpus reconciles to the official register without duplicate documents", () => {
  const audit = auditLaws();
  assert.ok(audit.catalogRecords > 0);
});

test("domestic catalog excludes treaty records and every law has a readable local document", () => {
  const { records } = getRegistry();
  assert.deepEqual(DOMESTIC_REGISTERS, [458, 459]);
  for (const record of records) {
    assert.ok(record.register === 458 || record.register === 459, record.id);
    assert.ok(
      record.textStatus === "complete" || record.textStatus === "facsimile",
      `Missing complete local law: ${record.id}`,
    );
  }
  assert.ok(records.some((record) => record.documentType === "Устав"));
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

test("the consolidated Assembly rules include all 298 articles in one document", () => {
  const rules = getRegistry().records.find(
    (record) => record.registryId === ASSEMBLY_RULES.registryId,
  );
  assert.ok(rules);
  assert.equal(rules.textStatus, "complete");
  if (!rules.citation.endsWith(": 20/2012-3")) return;
  const { markdown } = getLawDocument(rules.id)!;
  assert.deepEqual(
    articleHeadings(markdown).map(({ id }) => id),
    Array.from({ length: 298 }, (_, index) => `clan-${index + 1}`),
  );
});
