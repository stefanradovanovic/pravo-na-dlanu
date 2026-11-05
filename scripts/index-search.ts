import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import * as pagefind from "pagefind";
import { getRegistry, getLawDocument } from "../src/lib/registry";
import { normalizeSearch } from "../src/lib/search";
import { lawPath } from "../src/lib/registry-types";
const { index, errors } = await pagefind.createIndex({ forceLanguage: "sr" });
if (!index || errors.length) throw new Error(errors.join("\n"));
let count = 0;
try {
  for (const record of getRegistry().records) {
    if (record.textStatus !== "complete") continue;
    const document = getLawDocument(record.id)!;
    const { errors } = await index.addCustomRecord({
      url: lawPath(record.id),
      content: normalizeSearch(
        record.title + " " + document.markdown.replace(/<[^>]+>/g, " "),
      ),
      language: "sr",
      meta: { id: record.id, title: record.title },
      filters: { law: [record.id] },
    });
    if (errors.length) throw new Error(`${record.id}: ${errors.join("\n")}`);
    count++;
  }
  // Discard stale search fragments when the catalog changes scope.
  const projectRoot = path.resolve();
  const outputPath = path.resolve(projectRoot, "public/pagefind");
  assert.equal(
    path.relative(projectRoot, outputPath).replaceAll("\\", "/"),
    "public/pagefind",
  );
  await fs.rm(outputPath, { recursive: true, force: true });
  const output = await index.writeFiles({ outputPath });
  if (output.errors.length) throw new Error(output.errors.join("\n"));
  await fs.writeFile(
    "public/pagefind/coverage.json",
    JSON.stringify({
      indexedDocuments: count,
      sourceSnapshot: getRegistry().report.finishedAt,
    }),
  );
  console.log(
    `Indexed ${count} complete law documents. Search accepts Cyrillic and Latin.`,
  );
} finally {
  await pagefind.close();
}
