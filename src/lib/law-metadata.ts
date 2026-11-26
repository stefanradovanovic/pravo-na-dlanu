import { lawPath, type RegistryRecord } from "./registry-types";
import { siteMetadata } from "./social-metadata";

export function lawMetadata(record: RegistryRecord) {
  const scan = record.textStatus === "facsimile" ? record.facsimile : undefined;
  const version = scan?.version ?? record.citation;
  const citation = version.startsWith(record.title)
    ? version.slice(record.title.length).replace(/^:\s*/, "").trim()
    : version;
  const coverage = scan
    ? "Факсимил целог прописа из ПИС-а."
    : record.textStatus === "source-only"
      ? "Запис са везом ка извору у ПИС-у."
      : "Цео доступни текст из ПИС-а.";

  return {
    ...siteMetadata(lawPath(record)),
    title: record.title,
    description: [record.title + ".", coverage, citation]
      .filter(Boolean)
      .join(" "),
  };
}
