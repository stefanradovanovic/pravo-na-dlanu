export type Facsimile = {
  sourceUrl: string;
  sourceSha256: string;
  fetchedAt: string;
  version: string;
  coverage: string;
  pageLabels: string[];
  parts: { url: string; sha256: string; pages: number }[];
};
export type RegistryRecord = {
  id: string;
  registryId: string;
  title: string;
  citation: string;
  documentType: string;
  categories: string[];
  groups: string[];
  sourceUrl: string;
  contentUrl: string;
  fetchedAt: string;
  sha256: string;
  characters: number;
  hasTables: boolean;
  hasImages: boolean;
  sourceFormat?: "html" | "pdf";
  register?: number;
  pages?: number;
  textStatus?: "complete" | "facsimile" | "source-only";
  facsimile?: Facsimile;
  textSha256?: string;
  sourceIssue?: "wrong-text" | "editorial-only" | "unavailable";
  sourceNote?: string;
  aliases?: {
    id: string;
    registryId: string;
    citation: string;
    sourceUrl: string;
    sha256: string;
    fetchedAt: string;
  }[];
  identityNote?: string;
};
export type RegistryReport = {
  schemaVersion: number;
  scope: string;
  source: string;
  startedAt: string;
  finishedAt: string;
  catalogRows: number;
  expectedUniqueRecords: number;
  importedRecords: number;
  status: string;
  meaning: string;
  fullTextRecords?: number;
  facsimileRecords?: number;
  sourceOnlyRecords?: number;
  sourceRecords?: number;
  mergedSourceRecords?: number;
  failures: { id: string; message: string }[];
  partitions: { levels: number[]; expected: number; received: number }[];
};
export type Registry = { report: RegistryReport; records: RegistryRecord[] };
export function categoryLabel(value: string) {
  const label = value.replace(/^[IVXLCDM]+\s+/u, "").toLocaleLowerCase("sr");
  return label.charAt(0).toLocaleUpperCase("sr") + label.slice(1);
}
export function lawPath(id: string) {
  return `/propisi/${id}`;
}
