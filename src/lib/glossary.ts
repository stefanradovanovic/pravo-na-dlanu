import { normalizeSearch } from "./search";

export type GlossaryEntry = {
  id: string;
  title: string;
  definition: string;
  distinction?: string;
  example?: string;
  references: { source: string; label: string }[];
};

export type GlossaryTopic = {
  id: string;
  title: string;
  entries: GlossaryEntry[];
};

export type GlossarySource = {
  url: string;
  lawHref?: string;
  version?: string;
  accessedAt?: string;
  needsReview?: boolean;
};

function searchText(value: string) {
  return normalizeSearch(value).replaceAll("dj", "d");
}

export function indexGlossary(topics: readonly GlossaryTopic[]) {
  return topics.flatMap((topic) =>
    topic.entries.map((entry) => ({
      topicId: topic.id,
      entry,
      heading: searchText(entry.title),
      body: searchText(`${entry.definition} ${entry.distinction ?? ""}`),
    })),
  );
}

export function matchingGlossaryEntries(
  index: ReturnType<typeof indexGlossary>,
  query: string,
  topicId: string,
) {
  const entries = topicId
    ? index.filter((item) => item.topicId === topicId)
    : index;
  const words = searchText(query).split(" ").filter(Boolean);
  const byTitle = entries.filter(({ heading }) =>
    words.every((word) => heading.includes(word)),
  );
  return byTitle.length
    ? byTitle
    : entries.filter(({ heading, body }) =>
        words.every((word) => heading.includes(word) || body.includes(word)),
      );
}
