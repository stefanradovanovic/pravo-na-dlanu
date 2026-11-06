import { test } from "node:test";
import assert from "node:assert/strict";
import { getLibrary } from "../src/lib/content";
import { articleHeadings } from "../src/lib/document-navigation";
import { getLawExamples } from "../src/lib/learning-examples";
import { learningSourceChanged } from "../src/lib/learning-source";
import { findLearningLaw, getLawDocument } from "../src/lib/registry";

test("law readers withhold pinned examples after a citation or body change", () => {
  const law = findLearningLaw("zakon-o-radu")!;
  const headings = articleHeadings(getLawDocument(law.id)!.markdown);
  const original = { citation: law.citation, sha256: law.sha256 };
  const initial = getLawExamples(law.id, headings)!;
  assert.ok(initial.examples.length > 0);
  assert.equal(initial.heldExamples, 0);
  const pinned = new Set(
    getLibrary()
      .articles.filter(
        (article) => article.lawId === "zakon-o-radu" && article.practice,
      )
      .map((article) => article.id),
  );
  assert.ok(pinned.size > 0);
  try {
    law.sha256 = "0".repeat(64);
    const changedBody = getLawExamples(law.id, headings)!;
    assert.ok(changedBody.heldExamples! > 0);
    assert.ok(
      changedBody.examples.every(({ article }) => !pinned.has(article.id)),
    );
    assert.equal(
      changedBody.examples.length + changedBody.heldExamples!,
      initial.examples.length,
    );

    law.citation = "Промењена верзија извора";
    const changedVersion = getLawExamples(law.id, headings)!;
    assert.deepEqual(changedVersion.examples, []);
    assert.equal(changedVersion.heldExamples, initial.examples.length);
    assert.ok(changedVersion.learningHref);
  } finally {
    Object.assign(law, original);
  }
});

test("missing article anchors hold only the affected examples", () => {
  const law = findLearningLaw("zakon-o-radu")!;
  const headings = articleHeadings(getLawDocument(law.id)!.markdown);
  const initial = getLawExamples(law.id, headings)!;
  const missingNumber = initial.examples[0].article.number;
  const result = getLawExamples(
    law.id,
    headings.filter((heading) => heading.id !== `clan-${missingNumber}`),
  )!;
  assert.ok(
    result.examples.every(({ article }) => article.number !== missingNumber),
  );
  assert.equal(
    result.heldExamples,
    initial.examples.filter(({ article }) => article.number === missingNumber)
      .length,
  );
  assert.ok(result.examples.every(({ sourceHref }) => sourceHref));
});

test("legacy source pins detect version changes without claiming a checksum comparison", () => {
  const legacyPin = { sourceVersion: "Сачувана верзија" };
  assert.equal(
    learningSourceChanged(legacyPin, {
      citation: legacyPin.sourceVersion,
      sha256: "changed",
    }),
    false,
  );
  assert.equal(
    learningSourceChanged(legacyPin, {
      citation: "Нова верзија",
      sha256: "changed",
    }),
    true,
  );
});
