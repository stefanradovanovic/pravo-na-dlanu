import fs from "node:fs/promises";
import type { Registry } from "../src/lib/registry-types";
import {
  attachFacsimile,
  verifyFacsimileAssets,
  type Facsimiles,
} from "./facsimiles";

const registry: Registry = JSON.parse(
  await fs.readFile("content/registry.json", "utf8"),
);
const entries: Facsimiles = JSON.parse(
  await fs.readFile("content/facsimiles.json", "utf8"),
);
verifyFacsimileAssets(entries);
const recordIds = new Set(registry.records.map((record) => record.id));
for (const id of Object.keys(entries)) {
  if (!recordIds.has(id))
    throw new Error(`Unknown law in scan manifest: ${id}`);
}
// Validate all source identities before changing the published snapshot.
const bodies = new Map<string, string>();
for (const record of registry.records) {
  if (entries[record.id])
    bodies.set(record.id, attachFacsimile(record, entries[record.id]));
}
for (const record of registry.records) {
  const body = bodies.get(record.id);
  if (body)
    await fs.writeFile(
      `content/corpus/${record.id}.md`,
      `---\n${JSON.stringify(record, null, 2)}\n---\n\n${body}`,
    );
}
registry.report.fullTextRecords = registry.records.filter(
  (record) => record.textStatus === "complete",
).length;
registry.report.facsimileRecords = registry.records.filter(
  (record) => record.textStatus === "facsimile",
).length;
registry.report.sourceOnlyRecords = registry.records.filter(
  (record) => record.textStatus === "source-only",
).length;
await fs.writeFile(
  "content/registry.json",
  JSON.stringify(registry, null, 2) + "\n",
);
console.log(
  `${registry.report.facsimileRecords} complete scans; ${registry.report.sourceOnlyRecords} source-only records.`,
);
