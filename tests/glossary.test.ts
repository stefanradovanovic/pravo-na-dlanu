import assert from "node:assert/strict";
import { test } from "node:test";
import { getGlossaryCatalog } from "../src/lib/glossary-content";
import { indexGlossary, matchingGlossaryEntries } from "../src/lib/glossary";

const { topics, sources } = getGlossaryCatalog();
const index = indexGlossary(topics);

test("all researched dictionary entries have definitions and a pinned PIS source", () => {
  assert.equal(topics.length, 11);
  assert.equal(index.length, 300);
  assert.equal(new Set(index.map(({ entry }) => entry.id)).size, index.length);
  for (const { entry } of index) {
    assert.ok(entry.definition.length);
    assert.ok(entry.references.every(({ source }) => sources[source]?.url));
    assert.ok(
      entry.references.some(({ source }) => {
        const reference = sources[source];
        return (
          reference.version &&
          reference.accessedAt &&
          new URL(reference.url).hostname.endsWith(
            ".pravno-informacioni-sistem.rs",
          )
        );
      }),
      entry.title,
    );
  }
});

test("dictionary search handles Serbian scripts, simplified spellings and topic filters", () => {
  const find = (query: string, topicId = "") =>
    matchingGlossaryEntries(index, query, topicId).map(
      ({ entry }) => entry.title,
    );

  for (const spelling of [
    "јавни извршитељ",
    "javni izvršitelj",
    "javni izvrsitelj",
  ]) {
    assert.deepEqual(find(spelling), ["Јавни извршитељ"]);
  }
  assert.deepEqual(find("gradanska prava"), find("građanska prava"));
  assert.deepEqual(find("nasledje"), find("naslede"));
  const family = topics.find(({ title }) => title === "Породица и наслеђе")!;
  assert.equal(find("", family.id).length, family.entries.length);
  assert.deepEqual(find("тестамент", family.id), ["Завештање (тестамент)"]);
  assert.deepEqual(find("јавни извршитељ", family.id), []);
  assert.deepEqual(find("zz-нема-појма"), []);
});
