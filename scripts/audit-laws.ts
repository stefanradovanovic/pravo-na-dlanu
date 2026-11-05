import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { getRegistry, getLawDocument } from "../src/lib/registry";
import { normalizeSearch } from "../src/lib/search";
import { duplicateGroups, sha256 } from "./legal-source";
import { lawIdentity } from "./canonicalize-laws";
import { assertPisUrl } from "./source-policy";

export function auditLaws() {
  const { records, report } = getRegistry();

  const sourceIds = records.flatMap((r) => [
    r.registryId,
    ...(r.aliases ?? []).map((a) => a.registryId),
  ]);
  assert.equal(
    sourceIds.length,
    report.catalogRows,
    "A register entry was lost during deduplication",
  );
  assert.equal(
    new Set(sourceIds).size,
    sourceIds.length,
    "A source entry belongs to more than one document",
  );
  assert.equal(
    new Set(records.map(lawIdentity)).size,
    records.length,
    "Duplicate legal identities",
  );
  assert.equal(
    report.status,
    "complete-catalog",
    "Import has not completed successfully",
  );
  assert.equal(report.failures.length, 0, "Unresolved source failures");
  assert.equal(
    records.length,
    report.expectedUniqueRecords,
    "Catalog is incomplete",
  );
  assert.equal(
    new Set(records.map((r) => r.id)).size,
    records.length,
    "Duplicate canonical IDs",
  );
  assert.equal(
    new Set(records.map((r) => r.registryId)).size,
    records.length,
    "Duplicate registry IDs",
  );
  assert.equal(
    report.partitions.reduce((n, p) => n + p.expected, 0),
    report.catalogRows,
    "Partition counts do not reconcile",
  );
  for (const p of report.partitions)
    assert.equal(p.expected, p.received, "Truncated partition");
  const files = fs
    .readdirSync(path.resolve("content/corpus"))
    .filter((f) => f.endsWith(".md"));
  assert.equal(
    files.length,
    records.length,
    "Missing or orphaned law documents",
  );
  const hashes: { id: string; hash: string; title: string }[] = [];
  const titleWarnings: { id: string; title: string }[] = [];
  for (const r of records) {
    assert.ok(/^(?:[a-f0-9-]{36}|reg-\d+)$/.test(r.id));
    assert.ok(["Закон", "Устав"].includes(r.documentType));
    assert.ok(
      r.categories.length && new Set(r.categories).size === r.categories.length,
    );
    assert.ok(r.register === 458 || r.register === 459 || r.register === 206);
    assertPisUrl(r.sourceUrl);
    assertPisUrl(r.contentUrl);
    for (const alias of r.aliases ?? []) assertPisUrl(alias.sourceUrl);
    assert.equal(
      new URL(r.sourceUrl).hostname,
      "www.pravno-informacioni-sistem.rs",
    );
    assert.equal(
      new URL(r.contentUrl).hostname,
      "reg.pravno-informacioni-sistem.rs",
    );
    assert.ok(/^[a-f0-9]{64}$/.test(r.sha256));
    assert.ok(Number.isFinite(Date.parse(r.fetchedAt)));
    const { markdown } = getLawDocument(r.id)!;
    const raw = fs
      .readFileSync(path.join("content/corpus", r.id + ".md"), "utf8")
      .replace(/\r\n/g, "\n");
    const frontmatter = JSON.parse(raw.slice(4, raw.indexOf("\n---\n", 4)));
    assert.deepEqual(frontmatter, r, `Metadata mismatch: ${r.id}`);
    if (r.sourceFormat === "pdf") {
      assert.ok(r.sourceUrl.endsWith("/viewPdf/" + r.registryId));
    } else {
      assert.ok(r.sourceUrl.endsWith("/viewAct/" + r.id));
      assert.equal(
        new URL(r.contentUrl).searchParams.get("lawActId"),
        r.registryId,
      );
    }
    if (r.textStatus === "source-only") {
      assert.equal(r.characters, 0);
      if (r.sourceFormat === "html") assert.ok(r.sourceIssue);
    } else {
      assert.equal(r.textStatus, "complete");
      assert.ok(!r.sourceIssue);
      assert.ok(r.characters > 80 && markdown.length > 80);
      const normalized = normalizeSearch(markdown.replace(/<[^>]+>/g, " "));
      assert.equal(
        r.textSha256,
        sha256(normalized),
        `Body checksum mismatch: ${r.id}`,
      );
      hashes.push({ id: r.id, title: r.title, hash: sha256(normalized) });
      // Some source titles are editorially abbreviated; these are review candidates, not automatic mergers.
      if (!normalized.includes(normalizeSearch(r.title)))
        titleWarnings.push({ id: r.id, title: r.title });
    }
  }
  const duplicateBodies = duplicateGroups(hashes, (r) => r.hash);
  fs.mkdirSync(".cache", { recursive: true });
  fs.writeFileSync(
    ".cache/title-warnings.json",
    JSON.stringify(titleWarnings, null, 2),
  );
  assert.equal(
    duplicateBodies.length,
    0,
    `Identical complete texts: ${JSON.stringify(duplicateBodies)}`,
  );
  const duplicateTitles = duplicateGroups(records, (r) =>
    normalizeSearch(r.title),
  ).map((g) => g.map((r) => ({ id: r.id, citation: r.citation })));
  return {
    catalogRecords: records.length,
    fullTexts: hashes.length,
    sourceOnlyRecords: records.length - hashes.length,
    sourceIssues: records
      .filter((r) => r.sourceIssue)
      .map((r) => ({ id: r.id, issue: r.sourceIssue })),
    duplicateIds: 0,
    duplicateBodies: 0,
    duplicateTitles,
    titleWarnings,
    snapshot: report.finishedAt,
  };
}
if (process.argv[1]?.replace(/\\/g, "/").endsWith("/audit-laws.ts")) {
  const result = auditLaws();
  fs.mkdirSync(".cache", { recursive: true });
  fs.writeFileSync(
    ".cache/content-audit.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
}
