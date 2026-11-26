import type { RegistryRecord } from "./registry-types";
import { findLawSearchTopic } from "./search";
import {
  findSearchSnippet,
  loadSearchPassages,
  type SearchSnippet,
} from "./search-snippet";

type SearchModule = {
  filters: () => Promise<unknown>;
  search: (
    query: string,
    options?: { filters: { law: { any: string[] } } },
  ) => Promise<{
    filters: { law: Record<string, number> };
    results: { data: () => Promise<{ meta: { id: string } }> }[];
  }>;
};

let searchModule: Promise<SearchModule> | undefined;
function loadSearch() {
  const modulePath = "/pagefind/pagefind.js";
  return (searchModule ??= import(/* webpackIgnore: true */ modulePath)
    .then(async (engine) => {
      await engine.filters();
      return engine;
    })
    .catch((error) => {
      searchModule = undefined;
      throw error;
    }) as Promise<SearchModule>);
}

export async function searchLawText(query: string) {
  const engine = await loadSearch();
  const result = await engine.search(
    query.includes(" ") ? `"${query}"` : query,
  );
  return new Set(
    Object.entries(result.filters.law ?? {})
      .filter(([, count]) => count > 0)
      .map(([id]) => id),
  );
}

export type LawPassageMatch = {
  law: RegistryRecord;
  snippet: SearchSnippet;
};

export async function suggestLawPassages(
  query: string,
  records: readonly RegistryRecord[],
  category: string,
  signal: AbortSignal,
): Promise<LawPassageMatch[]> {
  const engine = await loadSearch();
  signal.throwIfAborted();
  const options =
    category === "all"
      ? undefined
      : { filters: { law: { any: records.map(({ id }) => id) } } };
  const { results } = await engine.search(query, options);
  signal.throwIfAborted();
  const topic = findLawSearchTopic(query);
  const preferred = topic && records.find(({ title }) => title === topic.title);
  async function findPassage(law: RegistryRecord) {
    const passages = await loadSearchPassages(law.id, signal);
    const snippet = findSearchSnippet(passages, query, {
      before: 24,
      after: 64,
    });
    return snippet ? { law, snippet } : null;
  }

  // Pagefind admits incomplete words. Check the original passage before offering a link.
  const candidates = await Promise.allSettled([
    ...(preferred ? [findPassage(preferred)] : []),
    ...results.slice(0, 10).map(async (result) => {
      const { meta } = await result.data();
      signal.throwIfAborted();
      if (meta.id === preferred?.id) return null;
      const law = records.find(({ id }) => id === meta.id);
      return law ? findPassage(law) : null;
    }),
  ]);

  return candidates
    .flatMap((candidate) =>
      candidate.status === "fulfilled" && candidate.value
        ? [candidate.value]
        : [],
    )
    .slice(0, 6);
}
