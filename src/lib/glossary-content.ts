import { z } from "zod";
import { readLearningContent } from "./content";
import type { GlossarySource, GlossaryTopic } from "./glossary";
import { getRegistry } from "./registry";
import { lawPath } from "./registry-types";

const id = z.string().regex(/^[a-z0-9-]+$/);
const text = z.string().min(1);
const httpsUrl = z.url({ protocol: /^https$/ });
const lawSource = z.object({
  lawId: z.uuid(),
  url: httpsUrl.refine((url) =>
    new URL(url).hostname.endsWith(".pravno-informacioni-sistem.rs"),
  ),
  version: text,
  accessedAt: z.iso.date(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
const glossarySchema = z.object({
  topics: z
    .array(
      z.object({
        id,
        title: text,
        entries: z
          .array(
            z.object({
              id,
              title: text,
              definition: text,
              distinction: text.optional(),
              example: text.optional(),
              references: z
                .array(z.object({ source: text, label: text }))
                .min(1),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
  sources: z.record(
    text,
    z.union([lawSource, z.strictObject({ url: httpsUrl })]),
  ),
});

export function getGlossaryCatalog(): {
  topics: GlossaryTopic[];
  sources: Record<string, GlossarySource>;
} {
  const { topics, sources } = glossarySchema.parse(
    readLearningContent().glossary,
  );
  const topicIds = new Set<string>();
  const entryIds = new Set<string>();
  const records = new Map(getRegistry().records.map((law) => [law.id, law]));

  for (const topic of topics) {
    if (topicIds.has(topic.id))
      throw new Error(`Duplicate glossary topic: ${topic.id}`);
    topicIds.add(topic.id);
    for (const entry of topic.entries) {
      if (entryIds.has(entry.id))
        throw new Error(`Duplicate glossary entry: ${entry.id}`);
      entryIds.add(entry.id);
      const references = entry.references.map(({ source }) => sources[source]);
      if (
        references.some((source) => !source) ||
        !references.some((source) => source && "lawId" in source)
      ) {
        throw new Error(`Invalid glossary sources: ${entry.id}`);
      }
    }
  }

  return {
    topics,
    sources: Object.fromEntries(
      Object.entries(sources).map(([key, source]) => {
        if (!("lawId" in source)) return [key, source];
        const law = records.get(source.lawId);
        return [
          key,
          {
            url: source.url,
            lawHref:
              law && law.textStatus !== "source-only"
                ? lawPath(law)
                : undefined,
            version: source.version,
            accessedAt: source.accessedAt,
            needsReview: law?.sha256 !== source.sha256,
          },
        ];
      }),
    ),
  };
}
