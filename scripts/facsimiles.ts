import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { sha256 } from "./legal-source";
import type { Facsimile, RegistryRecord } from "../src/lib/registry-types";
import { assertPisUrl } from "./source-policy";

export type FacsimileEntry = {
  baseSourceSha256: string;
  citation: string;
  facsimile: Facsimile;
  evidence: {
    sourcePages: number[];
    startTitle: string;
    closingProvision: string;
    method: string;
  };
};
export type Facsimiles = Record<string, FacsimileEntry>;

export function verifyFacsimileAssets(entries: Facsimiles) {
  const checked = new Set<string>();
  for (const entry of Object.values(entries)) {
    for (const part of entry.facsimile.parts) {
      assert.equal(part.url, `/pis/${part.sha256}.pdf`);
      assert.match(part.sha256, /^[a-f0-9]{64}$/);
      if (checked.has(part.url)) continue;
      const bytes = fs.readFileSync(path.resolve("public", part.url.slice(1)));
      assert.equal(
        bytes.subarray(0, 5).toString(),
        "%PDF-",
        `Invalid PDF asset: ${part.url}`,
      );
      assert.equal(
        sha256(bytes),
        part.sha256,
        `Scan asset checksum mismatch: ${part.url}`,
      );
      checked.add(part.url);
    }
  }
}

export function attachFacsimile(record: RegistryRecord, entry: FacsimileEntry) {
  assert.equal(
    entry.baseSourceSha256,
    record.sha256,
    `PIS response changed; review the scan before publication: ${record.id}`,
  );
  assert.equal(
    entry.citation,
    record.citation,
    `PIS publication changed: ${record.id}`,
  );
  assertPisUrl(entry.facsimile.sourceUrl);
  const scan = entry.facsimile;
  assert.match(scan.sourceSha256, /^[a-f0-9]{64}$/);
  assert.ok(Number.isFinite(Date.parse(scan.fetchedAt)));
  assert.ok(
    scan.coverage &&
      scan.version &&
      entry.evidence.startTitle &&
      entry.evidence.closingProvision,
  );
  assert.ok(scan.parts.length > 0, "A complete scan needs local PDF files");
  for (const part of scan.parts) {
    assert.match(part.sha256, /^[a-f0-9]{64}$/);
    assert.equal(part.url, `/pis/${part.sha256}.pdf`);
    assert.ok(Number.isInteger(part.pages) && part.pages > 0);
  }
  assert.equal(
    scan.pageLabels.length,
    scan.parts.reduce((total, part) => total + part.pages, 0),
    "Scan page counts do not reconcile",
  );
  assert.ok(
    entry.evidence.sourcePages.length > 0 &&
      entry.evidence.sourcePages.every(
        (page) => Number.isInteger(page) && page >= 0,
      ),
  );
  assert.equal(
    entry.evidence.sourcePages.length,
    scan.pageLabels.length,
    "Every displayed scan page needs source-page provenance",
  );
  assert.equal(
    new Set(entry.evidence.sourcePages).size,
    entry.evidence.sourcePages.length,
    "Repeated source pages in a law",
  );
  record.textStatus = "facsimile";
  record.facsimile = scan;
  record.characters = 0;
  delete record.textSha256;
  return `# ${record.title}\n\n${scan.coverage}\n\n**Издање:** ${scan.version}\n\n**Преузето из ПИС-а:** ${scan.fetchedAt}\n\nСкен је део овог јединственог документа. OCR није објављен као нормативни текст и није укључен у претрагу целог текста.\n\n${scan.parts.map((part, index) => `[Факсимил${scan.parts.length > 1 ? ` — део ${index + 1}` : ""}](${part.url})`).join("\n\n")}\n`;
}
