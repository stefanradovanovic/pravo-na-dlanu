import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { getRegistry } from "../src/lib/registry";

const root = path.resolve("out");
const files: { file: string; bytes: number }[] = [];
async function walk(folder: string) {
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) await walk(file);
    else
      files.push({
        file: path.relative(root, file).replaceAll("\\", "/"),
        bytes: (await fs.stat(file)).size,
      });
  }
}
await walk(root);
const paths = new Set(files.map((file) => file.file));
const registry = getRegistry();
assert.ok(paths.has("index.html"), "Missing static homepage");
assert.ok(paths.has("404.html"), "Missing static 404 page");
for (const record of registry.records) {
  assert.ok(
    paths.has(`propisi/${record.slug}.html`),
    `Missing readable law page: ${record.slug}`,
  );
  const html = await fs.readFile(
    path.join(root, `propisi/${record.slug}.html`),
    "utf8",
  );
  assert.ok(
    !html.includes("self.__next_f"),
    `Law still contains React navigation data: ${record.id}`,
  );
  assert.ok(
    html.includes('type="module" src="/reader-assets/'),
    `Missing reader controls: ${record.id}`,
  );
  assert.ok(
    paths.has(`propisi/${record.id}.html`),
    `Missing static law page: ${record.id}`,
  );
  if (record.textStatus === "complete") {
    assert.ok(
      paths.has(`pagefind/passages/${record.id}.json`),
      `Missing search excerpts: ${record.id}`,
    );
  }
  for (const part of record.facsimile?.parts ?? []) {
    assert.ok(paths.has(part.url.slice(1)), `Missing local scan: ${part.url}`);
  }
}
assert.ok(
  !files.some(({ file }) => /^(propisi|zakoni)\/.*\.txt$/.test(file)),
  "Standalone documents must not retain Next.js navigation payloads",
);
assert.ok(
  !files.some((file) => file.file.includes(".func/")),
  "Runtime functions are not part of this static deployment",
);
const report = {
  generatedAt: new Date().toISOString(),
  deployment:
    "Git-connected static export; no database, paid storage, or runtime functions",
  laws: registry.records.length,
  files: files.length,
  bytes: files.reduce((sum, file) => sum + file.bytes, 0),
  largestFiles: files.toSorted((a, b) => b.bytes - a.bytes).slice(0, 10),
  conditions: [
    "Vercel Hobby requires personal, non-commercial use and staying within its usage limits.",
    "Use the Git integration. The CLI's Hobby source-upload limit is 100 MB.",
    "A successful local build is not proof of a successful Vercel deployment.",
  ],
};
await fs.mkdir(".cache", { recursive: true });
await fs.writeFile(
  ".cache/hosting-report.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
