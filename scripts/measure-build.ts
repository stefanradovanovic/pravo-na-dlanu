import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { load } from "cheerio";
import { getRegistry } from "../src/lib/registry";

const label = process.argv[2] ?? "current";
if (!/^[a-z-]+$/.test(label)) throw new Error("Invalid measurement label");
const root = path.resolve("out");
const groups: Record<string, { bytes: number; files: number }> = {};
async function walk(directory: string) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else {
      const extension = path.extname(file) || "other";
      const group = (groups[extension] ??= { bytes: 0, files: 0 });
      group.bytes += (await fs.stat(file)).size;
      group.files++;
    }
  }
}
await walk(root);
const documents: Record<string, unknown> = {};
const samples: Record<string, unknown> = {};
for (const record of getRegistry().records) {
  const html = await fs.readFile(
    path.join(root, "propisi", `${record.slug}.html`),
    "utf8",
  );
  const $ = load(html);
  const article = $("#tekst-zakona");
  documents[record.id] = {
    title: $("h1").first().text(),
    // Compare all rendered legal text, not just a sample or a word count.
    textHash: createHash("sha256").update(article.text()).digest("hex"),
    headings: article
      .find("h2[id]")
      .map((_, el) => $(el).attr("id"))
      .get(),
    tables: article.find("table").length,
    cells: article.find("td, th").length,
    source: $(".source-banner > a").attr("href"),
    sourceNotice: $(".source-banner").text(),
  };
  if (
    [
      "zakon-o-radu",
      "zakon-o-sanitarnom-nadzoru",
      "zakon-o-zavrsnom-racunu-budzeta-republike-srbije-za-2020-godinu",
    ].includes(record.slug!)
  ) {
    samples[record.slug!] = {
      htmlBytes: Buffer.byteLength(html),
      gzipBytes: gzipSync(html).length,
    };
  }
}
const report = {
  label,
  generatedAt: new Date().toISOString(),
  bytes: Object.values(groups).reduce((sum, g) => sum + g.bytes, 0),
  files: Object.values(groups).reduce((sum, g) => sum + g.files, 0),
  laws: Object.keys(documents).length,
  groups,
  samples,
  documents,
};
await fs.mkdir(".cache", { recursive: true });
await fs.writeFile(
  `.cache/build-${label}.json`,
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify({ ...report, documents: undefined }, null, 2));
