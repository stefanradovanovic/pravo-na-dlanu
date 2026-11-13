import type { CatalogRecord } from "./catalog";
import { normalizeSearch } from "./search";

export type SearchResult = {
  id: string;
  data: () => Promise<{ meta: { id: string } }>;
};
export type SearchEngine = {
  search: (
    query: string,
    options: { filters?: { category: string } },
  ) => Promise<{ results: SearchResult[] }>;
};

export async function searchFullText(
  engine: SearchEngine,
  records: CatalogRecord[],
  query: string,
  category: string,
  page: number,
  phrase: boolean,
  size = 20,
) {
  const normalized = normalizeSearch(query);
  const result = await engine.search(
    phrase ? `"${normalized}"` : normalized,
    category === "all" ? {} : { filters: { category } },
  );
  // One indexed record per whole law. Preserve Pagefind relevance order, and
  // download metadata for this page only, not hundreds of complete fragments.
  const ranked = [
    ...new Map(result.results.map((hit) => [hit.id, hit])).values(),
  ];
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(ranked.length / size) - 1),
  );
  const data = await Promise.all(
    ranked
      .slice(currentPage * size, (currentPage + 1) * size)
      .map((hit) => hit.data()),
  );
  const byId = new Map(records.map((record) => [record.id, record]));
  const visible = data.map(({ meta }) => {
    const record = byId.get(meta.id);
    if (!record) throw new Error("Search index and catalogue do not match");
    return record;
  });
  return { records: visible, count: ranked.length, page: currentPage };
}
