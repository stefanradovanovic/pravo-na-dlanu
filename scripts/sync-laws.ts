import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { assessSource, assertPisUrl, type SourceIssues } from "./source-policy";
import { canonicalizeLaws } from "./canonicalize-laws";
import { convertLegalHtml, duplicateGroups, sha256 } from "./legal-source";
import type { RegistryRecord } from "../src/lib/registry-types";
const REG = "https://reg.pravno-informacioni-sistem.rs/api/",
  DI = "https://di.pravno-informacioni-sistem.rs/REG/";
const root = path.resolve("content"),
  cache = path.resolve(".cache/registry");
const issues: SourceIssues = JSON.parse(
  await fs.readFile(path.join(root, "source-issues.json"), "utf8"),
);
const recordSchema = z.object({
  id: z.string().regex(/^\d+$/),
  uuid: z.string().regex(/^(?:[a-f0-9-]{36})?$/i),
  title: z.string(),
  docType: z.string(),
  l2: z.string(),
  l3: z.string(),
  register: z.number().optional(),
});
const searchSchema = z.object({
  resultSize: z.number().int().nonnegative(),
  result: z.array(recordSchema),
  limit: z.number(),
});
type Row = z.infer<typeof recordSchema>;
const startedAt = new Date().toISOString(),
  failures: { id: string; message: string }[] = [],
  partitions: { levels: number[]; expected: number; received: number }[] = [];
await fs.mkdir(path.join(root, "corpus"), { recursive: true });
await fs.mkdir(cache, { recursive: true });
async function request(url: string, body?: unknown): Promise<Response> {
  assertPisUrl(url);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(45000),
        headers: {
          "User-Agent":
            "PravoNaDlanu/0.1 (public educational legal archive; github.com/stefanradovanovic/pravo-na-dlanu)",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
      });
      if (response.ok) {
        assertPisUrl(response.url);
        return response;
      }
      if (response.status === 401 || response.status === 403)
        throw new Error(`Access restricted: ${response.status}`);
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw new Error(`HTTP ${response.status}: ${url}`);
    } catch (error) {
      if (
        (error instanceof TypeError ||
          String(error).includes("TimeoutError")) &&
        attempt < 2
      ) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Request exhausted");
}
async function collect(levels: number[]): Promise<Row[]> {
  const result = searchSchema.parse(
    await (
      await request(DI + "advancedSearch", {
        l: [...levels, ...Array(5 - levels.length).fill(-1)],
        pau: null,
        aids: [],
        dids: ["19", "53"],
        tmo: true,
        bmo: true,
        limit: 500,
      })
    ).json(),
  );
  console.log(
    `Catalog ${levels.join("/") || "all"}: ${result.result.length}/${result.resultSize}`,
  );
  if (result.result.length === result.resultSize) {
    partitions.push({
      levels,
      expected: result.resultSize,
      received: result.result.length,
    });
    return result.result.map((r) => ({ ...r, register: levels[0] }));
  }
  if (result.resultSize < result.result.length)
    throw new Error("Inconsistent catalog count");
  const children = levels.length
    ? await (await request(REG + "regAreas?parentId=" + levels.at(-1))).json()
    : (await (await request(REG + "standardSearch/filter")).json()).areas;
  const areas = z
    .array(z.object({ k: z.string(), l: z.string() }))
    .parse(children);
  if (!areas.length || levels.length >= 4)
    throw new Error(
      "Cannot partition a truncated catalog; refusing partial success",
    );
  const rows: Row[] = [];
  for (const area of areas)
    rows.push(...(await collect([...levels, Number(area.k)])));
  if (rows.length !== result.resultSize)
    throw new Error(
      `Partition mismatch ${levels}: expected ${result.resultSize}, received ${rows.length}`,
    );
  return rows;
}
const rows = await collect([]);
await fs.writeFile(".cache/catalog.json", JSON.stringify(rows, null, 2));
const groups = new Map<string, Row[]>();
for (const row of rows) {
  const key = row.uuid.toLowerCase() || "reg-" + row.id;
  groups.set(key, [...(groups.get(key) ?? []), row]);
}
console.log(
  `Importing ${groups.size} unique records from ${rows.length} catalog rows.`,
);
let records: RegistryRecord[] = [];
let done = 0;
async function importRecord([id, memberships]: [string, Row[]]) {
  const row = memberships[0],
    cachedPath = path.join(cache, id + ".json");
  try {
    let cached:
      { title: string; record: RegistryRecord; markdown: string } | undefined;
    if (!process.argv.includes("--refresh")) {
      try {
        cached = JSON.parse(await fs.readFile(cachedPath, "utf8"));
      } catch {}
    }
    const categories = [...new Set(memberships.map((m) => m.l2))],
      subgroups = [...new Set(memberships.map((m) => m.l3))];
    let record: RegistryRecord, markdown: string;
    if (
      cached?.title === row.title &&
      new URL(cached.record.sourceUrl).hostname.endsWith(
        ".pravno-informacioni-sistem.rs",
      )
    ) {
      record = {
        ...cached.record,
        categories,
        groups: subgroups,
        register: row.register,
        sourceFormat: cached.record.sourceFormat ?? "html",
        textStatus: cached.record.textStatus ?? "complete",
      };
      markdown = cached.markdown
        .slice(cached.markdown.indexOf("\n---\n", 4) + 5)
        .trim();
    } else {
      const sourceFormat = row.uuid ? "html" : "pdf";
      const sourceUrl = row.uuid
        ? "https://www.pravno-informacioni-sistem.rs/viewAct/" + row.uuid
        : "https://www.pravno-informacioni-sistem.rs/viewPdf/" + row.id;

      const contentUrl = row.uuid
        ? REG + "viewAct/" + row.uuid + "?lawActId=" + row.id
        : REG + "viewPdf?actId=" + row.id;
      const response = await request(contentUrl);
      let content: {
        markdown: string;
        characters: number;
        hasTables: boolean;
        hasImages: boolean;
        textSha256?: string;
      };
      let hash: string;
      let issueData: Partial<RegistryRecord> = {};
      if (sourceFormat === "html") {
        const html = await response.text();
        content = convertLegalHtml(html, contentUrl);
        hash = sha256(html);
      } else {
        // The public source is sometimes a whole Gazette issue, not a standalone act.
        // Never label the entire issue or corrupted OCR as this law's complete text.
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
          if (!issues.unavailablePdfs.includes(row.id))
            throw new Error("PIS PDF endpoint returned a non-PDF response");
          issueData = {
            sourceIssue: "unavailable",
            sourceNote:
              "PDF веза ПИС-а тренутно враћа страницу са грешком. Запис је сачуван у каталогу, али текст није доступан у збирци. Извор ће бити поново проверен при освежавању.",
          };
        }
        hash = sha256(bytes);
        content = {
          markdown: "",
          characters: 0,
          hasTables: false,
          hasImages: false,
        };
      }
      record = {
        id,
        registryId: row.id,
        title: row.title.split(/:|\.\s*Службени/)[0].trim(),
        citation: row.title,
        documentType: row.docType,
        categories,
        groups: subgroups,
        register: row.register,
        sourceUrl,
        contentUrl,
        fetchedAt: new Date().toISOString(),
        sha256: hash,
        characters: content.characters,
        hasTables: content.hasTables,
        hasImages: content.hasImages,
        sourceFormat,
        textStatus: sourceFormat === "html" ? "complete" : "source-only",
        textSha256: content.textSha256,
        ...issueData,
      };
      markdown = content.markdown;
      await new Promise((r) => setTimeout(r, 100));
    }
    record.title = row.title.split(/:|\.\s*Службени/)[0].trim();
    markdown = assessSource(record, markdown, issues);
    const file =
      "---\n" + JSON.stringify(record, null, 2) + "\n---\n\n" + markdown + "\n";
    await fs.writeFile(
      cachedPath,
      JSON.stringify({ title: row.title, record, markdown: file }),
    );
    records.push(record);
    done++;
    if (done % 50 === 0) console.log(`Imported ${done}/${groups.size}`);
  } catch (error) {
    failures.push({ id, message: String(error) });
    console.error(`Failed ${row.title}: ${String(error)}`);
  }
}
const queue = [...groups.entries()];
let cursor = 0;
async function worker() {
  while (cursor < queue.length) {
    const entry = queue[cursor++];
    await importRecord(entry);
  }
}
await Promise.all([worker(), worker()]);
const order = new Map(queue.map(([id], i) => [id, i]));
records.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
const sourceRecords = records.length;
if (!failures.length)
  records = canonicalizeLaws(
    records,
    JSON.parse(
      await fs.readFile(path.join(root, "source-corrections.json"), "utf8"),
    ),
  );
const duplicateTexts = duplicateGroups(
  records.filter((r) => r.textStatus === "complete"),
  (r) => r.textSha256 ?? r.sha256,
).map((g) => g.map((r) => ({ id: r.id, title: r.title })));
const duplicateTitles = duplicateGroups(records, (r) =>
  r.title.replace(/\s+/g, " ").trim().toLocaleLowerCase("sr"),
).map((g) => g.map((r) => ({ id: r.id, citation: r.citation })));
if (duplicateTexts.length)
  failures.push({
    id: "duplicate-texts",
    message: `${duplicateTexts.length} identical HTML texts require review`,
  });
const report = {
  schemaVersion: 3,
  scope:
    "All records classified as Закон or Устав in the official register, across national, education and international-treaty subregisters.",
  source: "https://www.pravno-informacioni-sistem.rs/reg-search",
  startedAt,
  finishedAt: new Date().toISOString(),
  catalogRows: rows.length,
  sourceRecords,
  mergedSourceRecords: sourceRecords - records.length,
  expectedUniqueRecords: failures.length ? groups.size : records.length,
  importedRecords: records.length,
  fullTextRecords: records.filter((r) => r.textStatus === "complete").length,
  sourceIssues: records
    .filter((r) => r.sourceIssue)
    .map((r) => ({ id: r.id, issue: r.sourceIssue, note: r.sourceNote })),
  sourceOnlyRecords: records.filter((r) => r.textStatus === "source-only")
    .length,
  partitions,
  failures,
  status: failures.length ? "incomplete" : "complete-catalog",
  duplicateTexts,
  duplicateTitles,
  meaning:
    "Catalog completeness means every enumerated PIS register record is represented, after documented deduplication. Known broken, incorrect or editorial-only responses are explicitly flagged and excluded from full-text search. PDF-only records are not full-text Markdown. Gazette PDFs may contain multiple acts. Linked HTML attachments are not downloaded. Register membership is not an independent determination of legal effect.",
};
await fs.writeFile(
  ".cache/sync-report.json",
  JSON.stringify(report, null, 2) + "\n",
);
if (failures.length) {
  console.error(JSON.stringify({ ...report, partitions: partitions.length }));
  process.exitCode = 1;
} else {
  // Publish only after download reconciliation and duplicate checks pass.
  for (const record of records) {
    const cached = JSON.parse(
      await fs.readFile(path.join(cache, record.id + ".json"), "utf8"),
    );
    await fs.writeFile(
      path.join(root, "corpus", record.id + ".md"),
      "---\n" +
        JSON.stringify(record, null, 2) +
        "\n---\n\n" +
        cached.markdown
          .slice(cached.markdown.indexOf("\n---\n", 4) + 5)
          .trim() +
        "\n",
    );
  }
  const ids = new Set(records.map((r) => r.id + ".md"));
  for (const name of await fs.readdir(path.join(root, "corpus")))
    if (name.endsWith(".md") && !ids.has(name))
      await fs.unlink(path.join(root, "corpus", name));
  await fs.writeFile(
    path.join(root, "registry.json"),
    JSON.stringify({ report, records }, null, 2) + "\n",
  );
  console.log(JSON.stringify({ ...report, partitions: partitions.length }));
}
