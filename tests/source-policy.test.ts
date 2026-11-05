import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalizeLaws } from "../scripts/canonicalize-laws";
import { assessSource, assertPisUrl } from "../scripts/source-policy";
import type { RegistryRecord } from "../src/lib/registry-types";

function record(id: string, publication = "1/2020-1"): RegistryRecord {
  return {
    id,
    registryId: id,
    title: "Закон о провери",
    citation: `Закон о провери: ${publication}`,
    documentType: "Закон",
    categories: [id],
    groups: [],
    sourceUrl: `https://www.pravno-informacioni-sistem.rs/viewPdf/${id}`,
    contentUrl: `https://reg.pravno-informacioni-sistem.rs/api/viewPdf?actId=${id}`,
    fetchedAt: "2026-11-05T00:00:00Z",
    sha256: "a".repeat(64),
    characters: 0,
    hasTables: false,
    hasImages: false,
    sourceFormat: "pdf",
    textStatus: "source-only",
  };
}
test("same law merges category memberships and preserves every source record", () => {
  const result = canonicalizeLaws([record("1"), record("2")], []);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].categories, ["1", "2"]);
  assert.equal(result[0].aliases?.[0].registryId, "2");
});
test("same title in different Gazette publications remains separate", () => {
  assert.equal(
    canonicalizeLaws([record("1"), record("2", "5/2026-1")], []).length,
    2,
  );
});
test("different laws sharing one Gazette PDF are not duplicates", () => {
  const second = {
    ...record("2"),
    title: "Закон о другом питању",
    citation: "Закон о другом питању: 1/2020-2",
  };
  assert.equal(canonicalizeLaws([record("1"), second], []).length, 2);
});
test("wrong PIS text is quarantined and a changed response requires a new review", () => {
  const r = { ...record("1"), sourceFormat: "html" as const };
  const issues = {
    wrongTexts: { "1": { sha256: r.sha256, reason: "Wrong act" } },
    unavailablePdfs: [],
  };
  const body = assessSource(r, "Члан 1. Текст погрешног закона.", issues);
  assert.equal(r.textStatus, "source-only");
  assert.equal(r.sourceIssue, "wrong-text");
  assert.doesNotMatch(body, /Текст погрешног закона/);
  assert.throws(
    () => assessSource({ ...r, sha256: "b".repeat(64) }, "Changed", issues),
    /review before publishing/,
  );
});
test("editorial wrappers cannot be counted as complete legal texts", () => {
  const r = { ...record("1"), sourceFormat: "html" as const };
  assessSource(r, "Текст закона налази се у PDF издању.", {
    wrongTexts: {},
    unavailablePdfs: [],
  });
  assert.equal(r.textStatus, "source-only");
  assert.equal(r.sourceIssue, "editorial-only");
});
test("source policy accepts only HTTPS PIS hosts", () => {
  assert.doesNotThrow(() => assertPisUrl(record("1").sourceUrl));
  for (const url of [
    "https://www.parlament.gov.rs/law.pdf",
    "https://pravno-informacioni-sistem.rs.evil.test/law",
    "http://www.pravno-informacioni-sistem.rs/",
  ])
    assert.throws(() => assertPisUrl(url));
});
