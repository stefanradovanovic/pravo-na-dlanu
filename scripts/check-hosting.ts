import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { load } from "cheerio";
import { lawMetadata } from "../src/lib/law-metadata";
import { getRegistry } from "../src/lib/registry";
import { lawPath } from "../src/lib/registry-types";
import { siteUrl } from "../src/lib/social-metadata";

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
const publicPages = [
  "/",
  "/institucije",
  "/institucije/skupstina",
  "/institucije/skupstina/odbori",
  "/o-projektu",
  "/ucenje",
  "/ucenje/recnik",
];
const sitemap = load(
  await fs.readFile(path.join(root, "sitemap.xml"), "utf8"),
  {
    xml: true,
  },
);
const sitemapUrls = sitemap("urlset > url > loc")
  .map((_, location) => sitemap(location).text())
  .get();
const expectedUrls = [...publicPages, ...registry.records.map(lawPath)].map(
  siteUrl,
);
assert.deepEqual(
  sitemapUrls.toSorted(),
  expectedUrls.toSorted(),
  "Sitemap must list every canonical public page exactly once",
);
const robots = await fs.readFile(path.join(root, "robots.txt"), "utf8");
assert.ok(
  robots.split(/\r?\n/).includes("Sitemap: " + siteUrl("/sitemap.xml")),
  "Missing sitemap address in robots.txt",
);

function checkPageMetadata(html: string, pathname: string) {
  const $ = load(html.slice(0, html.indexOf("</head>") + "</head>".length));
  const url = siteUrl(pathname);
  const canonical = $('head link[rel="canonical"]');
  assert.equal(canonical.length, 1, pathname);
  assert.equal(canonical.attr("href"), url, pathname);
  assert.equal(
    $('head meta[property="og:url"]').attr("content"),
    url,
    pathname,
  );
  const description = $('head meta[name="description"]').attr("content");
  assert.ok(description, "Missing description for " + pathname);
  assert.equal(
    $('head meta[property="og:description"]').attr("content"),
    description,
    pathname,
  );
  assert.equal(
    $('head meta[name="twitter:description"]').attr("content"),
    description,
    pathname,
  );
  assert.doesNotMatch(
    $('head meta[name="robots"]').attr("content") ?? "",
    /noindex/i,
    pathname,
  );
  return description;
}

const publicDescriptions = new Set<string>();
for (const pathname of publicPages) {
  const file = pathname === "/" ? "index.html" : pathname.slice(1) + ".html";
  const html = await fs.readFile(path.join(root, file), "utf8");
  publicDescriptions.add(checkPageMetadata(html, pathname));
}
assert.equal(
  publicDescriptions.size,
  publicPages.length,
  "Public pages must have distinct descriptions",
);

for (const record of registry.records) {
  assert.ok(
    paths.has(`propisi/${record.slug}.html`),
    `Missing readable law page: ${record.slug}`,
  );
  const html = await fs.readFile(
    path.join(root, `propisi/${record.slug}.html`),
    "utf8",
  );
  const description = checkPageMetadata(html, lawPath(record));
  assert.equal(description, lawMetadata(record).description, record.id);
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
