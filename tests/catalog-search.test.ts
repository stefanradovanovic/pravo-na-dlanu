import { test } from "node:test";
import assert from "node:assert/strict";
import { catalogData, type CatalogRecord } from "../src/lib/catalog";
import { getRegistry } from "../src/lib/registry";
import { searchFullText, type SearchEngine } from "../src/lib/full-text-search";
import { searchLearningTopics } from "../src/lib/learning";

test("the client catalogue keeps navigation data without acquisition payloads", () => {
  const registry = getRegistry();
  const catalog = catalogData(
    registry,
    new Map([[registry.records[0].id, "ustav"]]),
  );
  assert.equal(catalog.records.length, registry.records.length);
  assert.equal(catalog.records[0].topicId, "ustav");
  for (const record of catalog.records) {
    assert.ok(record.slug && record.title && record.categories.length);
    assert.equal("facsimile" in record, false);
    assert.equal("sourceUrl" in record, false);
    assert.equal("checksum" in record, false);
  }
  assert.ok(
    Buffer.byteLength(JSON.stringify(catalog)) <
      Buffer.byteLength(JSON.stringify(registry)) * 0.6,
  );
});

test("full-text results preserve relevance and only load the requested page", async () => {
  const records = Array.from(
    { length: 45 },
    (_, index) => ({ id: String(index) }) as CatalogRecord,
  );
  const loaded: string[] = [];
  const queries: unknown[] = [];
  const engine: SearchEngine = {
    async search(query, options) {
      queries.push([query, options]);
      return {
        results: [...records].reverse().map((record) => ({
          id: `index-${record.id}`,
          async data() {
            loaded.push(record.id);
            return { meta: { id: record.id } };
          },
        })),
      };
    },
  };
  const result = await searchFullText(
    engine,
    records,
    "годишњи одмор",
    "Рад",
    1,
    false,
  );
  assert.deepEqual(
    result.records.map((record) => record.id),
    Array.from({ length: 20 }, (_, index) => String(24 - index)),
  );
  assert.equal(result.count, 45);
  assert.equal(loaded.length, 20);
  assert.deepEqual(queries[0], [
    "godisnji odmor",
    { filters: { category: "Рад" } },
  ]);
  const last = await searchFullText(
    engine,
    records,
    "godišnji odmor",
    "all",
    99,
    true,
  );
  assert.equal(last.page, 2);
  assert.equal(last.records.length, 5);
  assert.deepEqual(queries[1], ['"godisnji odmor"', {}]);
});

test("duplicate search hits collapse and stale metadata fails visibly", async () => {
  const hit = { id: "a", data: async () => ({ meta: { id: "law" } }) };
  const engine: SearchEngine = {
    search: async () => ({ results: [hit, hit] }),
  };
  const record = { id: "law" } as CatalogRecord;
  assert.equal(
    (await searchFullText(engine, [record], "рад", "all", 0, false)).count,
    1,
  );
  await assert.rejects(
    searchFullText(engine, [], "рад", "all", 0, false),
    /do not match/,
  );
});

test("everyday queries discover learning and its source law across Serbian scripts", () => {
  for (const query of [
    "plata",
    "плата",
    "плате",
    "годишњи одмор",
    "godišnji odmor",
    "godisnji odmor",
  ]) {
    assert.deepEqual(
      searchLearningTopics(query).map((topic) => topic.id),
      ["rad"],
    );
  }
  assert.deepEqual(searchLearningTopics(""), []);
  assert.deepEqual(searchLearningTopics("nepostojecipojam"), []);
});
