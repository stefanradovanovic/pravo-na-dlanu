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
  for (const article of getLibrary().articles) {
    const practice = article.practice;
    if (!practice) continue;
    const topic = learningTopics.find((t) => t.lawId === article.lawId);
    const law = findLearningLaw(article.lawId);
    const document = law && getLawDocument(law.id);
    if (
      !topic ||
      !law ||
      !document ||
      !articleHeadings(document.markdown).some(
        (h) => h.id === `clan-${article.number}`,
      )
    )
      throw new Error(`Invalid learning source: ${article.id}`);
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
    for (const { whatIf, ...base } of practice.questions) {
      const entries: LearningQuestion[] = [
        { ...base, topicId: topic.id, source, needsReview, revision: "" },
      ];
      if (whatIf)
        entries.push({
          ...whatIf,
          kind: "what-if",
          topicId: topic.id,
          source,
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
