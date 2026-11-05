import { test } from "node:test";
import assert from "node:assert/strict";
import { attachFacsimile, type FacsimileEntry } from "../scripts/facsimiles";
import type { RegistryRecord } from "../src/lib/registry-types";

const record = {
  id: "reg-1",
  sha256: "a".repeat(64),
  citation: "Закон о провери: 1/2020-1",
  title: "Закон о провери",
  textStatus: "source-only",
  characters: 0,
} as RegistryRecord;
function entry(): FacsimileEntry {
  const hash = "b".repeat(64);
  return {
    baseSourceSha256: record.sha256,
    citation: record.citation,
    facsimile: {
      sourceUrl:
        "https://reg.pravno-informacioni-sistem.rs/api/viewPdf?actId=1",
      sourceSha256: hash,
      fetchedAt: "2026-11-05T00:00:00Z",
      version: record.citation,
      coverage: "Цео закон из наведене објаве.",
      pageLabels: ["Страна гласила 2", "Страна гласила 3"],
      parts: [{ url: `/pis/${hash}.pdf`, sha256: hash, pages: 2 }],
    },
    evidence: {
      sourcePages: [1, 46],
      startTitle: record.title,
      closingProvision: "Овај закон ступа на снагу…",
      method: "Verified page sequence",
    },
  };
}
test("scans preserve one law across nonconsecutive source pages and stay outside text search", () => {
  const law = { ...record, textSha256: "c".repeat(64) };
  const body = attachFacsimile(law, entry());
  assert.equal(law.textStatus, "facsimile");
  assert.equal(law.characters, 0);
  assert.equal(law.textSha256, undefined);
  assert.match(body, /Факсимил/);
  assert.match(body, /OCR није објављен/);
});
test("changed PIS response or publication cannot silently reuse an old scan", () => {
  assert.throws(
    () => attachFacsimile({ ...record, sha256: "d".repeat(64) }, entry()),
    /PIS response changed/,
  );
  assert.throws(
    () => attachFacsimile({ ...record, citation: "2/2021-1" }, entry()),
    /PIS publication changed/,
  );
});
test("complete scans reject missing, duplicate and unaccounted pages", () => {
  for (const sourcePages of [[1], [1, 1], [1, 46, 47]]) {
    const scan = entry();
    scan.evidence.sourcePages = sourcePages;
    assert.throws(() => attachFacsimile({ ...record }, scan));
  }
  const scan = entry();
  scan.facsimile.parts[0].pages = 3;
  assert.throws(() => attachFacsimile({ ...record }, scan), /page counts/);
});
test("scan assets and source provenance cannot point to arbitrary remote files", () => {
  const scan = entry();
  scan.facsimile.sourceUrl = "https://example.com/law.pdf";
  assert.throws(() => attachFacsimile({ ...record }, scan));
  const other = entry();
  other.facsimile.parts[0].url = "/pis/../../secret.pdf";
  assert.throws(() => attachFacsimile({ ...record }, other));
});
