import { createHash } from "node:crypto";
import { getLibrary } from "./content";
import { findLearningLaw, getLawDocument } from "./registry";
import { lawPath } from "./registry-types";
import { articleHeadings } from "./document-navigation";
import { learningSourceChanged } from "./learning-source";
import {
  learningTopics,
  type LearningCatalog,
  type LearningQuestion,
  type LearningSource,
} from "./learning";

export function getLearningCatalog(): LearningCatalog {
  const catalog: LearningCatalog = { questions: [], lessons: [] };
  const ids = new Set<string>();
  const sources = new Map(
    learningTopics.map((topic) => {
      const law = findLearningLaw(topic.lawId);
      const document = law && getLawDocument(law.id);
      const headings = new Set(
        document ? articleHeadings(document.markdown).map((h) => h.id) : [],
      );
      const lawId: string = topic.lawId;
      return [lawId, { topic, law, headings }] as const;
    }),
  );
  for (const article of getLibrary().articles) {
    const practice = article.practice;
    if (!practice) continue;
    const entry = sources.get(article.lawId);
    if (!entry?.law || !entry.headings.has(`clan-${article.number}`))
      throw new Error(`Invalid learning source: ${article.id}`);
    const { topic, law } = entry;
    const needsReview = learningSourceChanged(practice, law);
    const source: LearningSource = {
      title: law.title,
      article: article.number,
      href: `${lawPath(law)}#clan-${article.number}`,
      lawHref: lawPath(law),
      url: law.sourceUrl,
      version: practice.sourceVersion,
      accessedAt: law.fetchedAt.slice(0, 10),
      checkedAt: practice.sourceCheckedAt,
      coverage: "Уредничко питање о наведеном члану; веза води на цео закон.",
    };
    catalog.lessons.push({
      id: article.id,
      topicId: topic.id,
      title: article.title,
      text: article.explanation,
      source,
      needsReview,
    });
    for (const { whatIf, sourceCheckedAt, ...base } of practice.questions) {
      const questionSource = sourceCheckedAt
        ? { ...source, checkedAt: sourceCheckedAt }
        : source;
      const entries: LearningQuestion[] = [
        {
          ...base,
          topicId: topic.id,
          source: questionSource,
          needsReview,
          revision: "",
        },
      ];
      if (whatIf)
        entries.push({
          ...whatIf,
          kind: "what-if",
          topicId: topic.id,
          source: questionSource,
          needsReview,
          parentId: base.id,
          originalScenario: base.scenario,
          revision: "",
        });
      for (const q of entries) {
        if (ids.has(q.id))
          throw new Error(`Duplicate learning question: ${q.id}`);
        ids.add(q.id);
        q.revision = createHash("sha256")
          .update(
            JSON.stringify({
              ...q,
              source: { ...q.source, accessedAt: undefined },
              sourceSha256: practice.sourceSha256,
            }),
          )
          .digest("hex")
          .slice(0, 16);
        catalog.questions.push(q);
      }
    }
  }
  return catalog;
}
