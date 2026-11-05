import { normalizeSearch } from "../src/lib/search";
import type { RegistryRecord } from "../src/lib/registry-types";
import { sha256 } from "./legal-source";

export type SourceIssues = {
  wrongTexts: Record<string, { sha256: string; reason: string }>;
  unavailablePdfs: string[];
};

export function sourceOnlyMarkdown(record: RegistryRecord) {
  return `# ${record.title}\n\n${record.sourceNote ?? "Засебан текст закона још није пренет у Markdown. ПИС пружа изворно PDF издање службеног гласила које може садржати више аката."}\n\n**Објава:** ${record.citation}\n\n[Отвори запис у ПИС-у](${record.sourceUrl}).\n`;
}

export function assessSource(
  record: RegistryRecord,
  markdown: string,
  issues: SourceIssues,
) {
  const known = issues.wrongTexts[record.id];
  if (known) {
    if (record.sha256 !== known.sha256)
      throw new Error(
        `Previously incorrect PIS response changed; review before publishing: ${record.id}`,
      );
    record.sourceIssue = "wrong-text";
    record.sourceNote =
      "HTML одговор ПИС-а садржи други акт. Погрешан текст није објављен. У ПИС-у проверите преглед гласила и библиографске податке за овај закон.";
  } else if (
    record.sourceFormat === "html" &&
    !/Члан\s+\d|Član\s+\d|ЧЛАН\s+\d|Чл\.\s*\d/u.test(markdown)
  ) {
    record.sourceIssue = "editorial-only";
    record.sourceNote =
      "HTML страница ПИС-а садржи објашњење или упутство ка PDF издању, а не цео текст закона. Отворите ПИС и његов преглед гласила.";
  }
  if (record.sourceIssue || record.sourceFormat === "pdf") {
    record.textStatus = "source-only";
    record.characters = 0;
    delete record.textSha256;
    return sourceOnlyMarkdown(record);
  }
  record.textStatus = "complete";
  record.textSha256 = sha256(
    normalizeSearch(markdown.replace(/<[^>]+>/g, " ")),
  );
  return markdown;
}

export function assertPisUrl(url: string) {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    !(
      parsed.hostname === "pravno-informacioni-sistem.rs" ||
      parsed.hostname.endsWith(".pravno-informacioni-sistem.rs")
    )
  ) {
    throw new Error(`Only HTTPS PIS sources are allowed: ${url}`);
  }
}
