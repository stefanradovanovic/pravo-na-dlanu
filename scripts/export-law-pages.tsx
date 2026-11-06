import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import type { ReactElement } from "react";
import { build } from "esbuild";
import { load } from "cheerio";
import { FullLawDocument } from "../src/components/full-law-document";
import { FacsimileReader } from "../src/components/facsimile-reader";
import { ReaderControl, type ReaderControlProps } from "../src/reader/controls";
import { escapeHtml, inlineJson } from "../src/reader/serialization";
import {
  getRegistry,
  getLawDocument,
  findLearningLaw,
} from "../src/lib/registry";
import { getLibrary } from "../src/lib/content";
import { lawPath } from "../src/lib/registry-types";

const root = path.resolve("out");
const records = getRegistry().records;
// Reuse the exported layout and CSS URLs. The generator does not duplicate the
// site's header/footer/styles or depend on private Next.js manifest formats.
const $ = load(
  await fs.readFile(
    path.join(root, "propisi", `${records[0].slug}.html`),
    "utf8",
  ),
);
assert.equal($("main#main").length, 1, "Missing standalone reader shell");
assert.ok($('link[rel="stylesheet"]').length, "Missing shared stylesheets");
$("script, link[as=script], link[rel=modulepreload]").remove();
$("title").text("LAW_PAGE_TITLE_PLACEHOLDER");
$('link[rel="canonical"]').attr("href", "LAW_PAGE_CANONICAL_PLACEHOLDER");
$("main#main").replaceWith("LAW_PAGE_BODY_PLACEHOLDER");

async function resetGeneratedDirectory(name: string) {
  assert.ok(["propisi", "zakoni", "reader-assets"].includes(name));
  const target = path.resolve(root, name);
  assert.equal(path.dirname(target), root);
  // Never follow a symlink into a different workspace during generated cleanup.
  assert.equal(await fs.realpath(root), root);
  const stat = await fs.lstat(target).catch(() => null);
  assert.ok(!stat?.isSymbolicLink(), `Unexpected symlink: ${target}`);
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(target, { recursive: true });
}
for (const name of ["propisi", "zakoni", "reader-assets"])
  await resetGeneratedDirectory(name);
const assets = await build({
  entryPoints: ["src/reader/entry.tsx", "src/reader/redirect.ts"],
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  outdir: path.join(root, "reader-assets"),
  entryNames: "[name]-[hash]",
  chunkNames: "chunk-[hash]",
  metafile: true,
});
function entryUrl(entryPoint: string) {
  const output = Object.entries(assets.metafile.outputs).find(
    ([, value]) => value.entryPoint === entryPoint,
  )?.[0];
  assert.ok(output, `Missing browser entry: ${entryPoint}`);
  return "/" + path.relative(root, output).replaceAll("\\", "/");
}
const readerUrl = entryUrl("src/reader/entry.tsx");
const redirectUrl = entryUrl("src/reader/redirect.ts");
$("body").append(`<script type="module" src="${readerUrl}"></script>`);
const template = $.html();

function island(
  id: string,
  props: unknown,
  element: ReactElement,
  scan = false,
) {
  // SSR and hydration use the same isolated root and useId prefix. Wrappers
  // have no layout box, preserving sticky/grid behavior of the existing UI.
  const html = renderToString(element, { identifierPrefix: id });
  return (
    <>
      <div
        id={id}
        data-reader-control={scan ? undefined : ""}
        data-reader-scan={scan ? "" : undefined}
        style={{ display: "contents" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <script
        id={`${id}-props`}
        type="application/json"
        dangerouslySetInnerHTML={{ __html: inlineJson(props) }}
      />
    </>
  );
}
function renderControl(props: ReaderControlProps) {
  return island(`reader-${props.kind}`, props, <ReaderControl {...props} />);
}
async function writeRedirect(file: string, href: string) {
  const html = `<!doctype html><html lang="sr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Пропис је премештен</title><link rel="canonical" href="${escapeHtml(href)}"></head><body><main><p>Пропис је премештен на читљиву адресу.</p><a data-law-redirect href="${escapeHtml(href)}">Отворите пропис →</a></main><script type="module" src="${redirectUrl}"></script></body></html>`;
  await fs.writeFile(file, html);
}

for (const [index, record] of records.entries()) {
  const document = getLawDocument(record.id);
  assert.ok(document, `Missing document: ${record.id}`);
  const body = renderToStaticMarkup(
    <FullLawDocument
      {...document}
      renderControl={renderControl}
      renderScan={(document) =>
        island(
          "reader-scan",
          { document },
          <FacsimileReader document={document} />,
          true,
        )
      }
    />,
  );
  const html = template
    .replace("LAW_PAGE_TITLE_PLACEHOLDER", () =>
      escapeHtml(`${record.title} | Право на длану`),
    )
    .replace("LAW_PAGE_CANONICAL_PLACEHOLDER", () =>
      escapeHtml(lawPath(record)),
    )
    .replace("LAW_PAGE_BODY_PLACEHOLDER", () => body);
  await fs.writeFile(path.join(root, "propisi", `${record.slug}.html`), html);
  await writeRedirect(
    path.join(root, "propisi", `${record.id}.html`),
    lawPath(record),
  );
  if ((index + 1) % 100 === 0)
    console.log(`Exported ${index + 1}/${records.length} standalone law pages`);
}
for (const law of getLibrary().laws) {
  const record = findLearningLaw(law.id);
  assert.ok(record, `Missing learning-law redirect: ${law.id}`);
  await writeRedirect(
    path.join(root, "zakoni", `${law.id}.html`),
    lawPath(record),
  );
}
console.log(
  `Exported all ${records.length} laws from Markdown with isolated reader controls.`,
);
