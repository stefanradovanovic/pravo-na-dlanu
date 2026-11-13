import type { Registry, RegistryRecord } from "./registry-types";

export type CatalogRecord = Pick<
  RegistryRecord,
  | "id"
  | "slug"
  | "title"
  | "citation"
  | "documentType"
  | "categories"
  | "textStatus"
  | "sourceIssue"
> & { topicId?: string };
export type Catalog = {
  records: CatalogRecord[];
  report: Pick<
    Registry["report"],
    | "finishedAt"
    | "importedRecords"
    | "fullTextRecords"
    | "facsimileRecords"
    | "sourceOnlyRecords"
  > & { failureCount: number };
};

/** The interactive catalogue needs no checksums, aliases or acquisition payloads. */
export function catalogData(
  registry: Registry,
  topics: Map<string, string>,
): Catalog {
  const {
    finishedAt,
    importedRecords,
    fullTextRecords,
    facsimileRecords,
    sourceOnlyRecords,
    failures,
  } = registry.report;
  return {
    report: {
      finishedAt,
      importedRecords,
      fullTextRecords,
      facsimileRecords,
      sourceOnlyRecords,
      failureCount: failures.length,
    },
    records: registry.records.map(
      ({
        id,
        slug,
        title,
        citation,
        documentType,
        categories,
        textStatus,
        sourceIssue,
      }) => ({
        id,
        slug,
        title,
        citation,
        documentType,
        categories,
        textStatus,
        sourceIssue,
        topicId: topics.get(id),
      }),
    ),
  };
}
