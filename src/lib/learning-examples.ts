import { getLibrary } from "./content";
import { findLearningLaw } from "./registry";
import type { ArticleHeading } from "./document-navigation";
import type { LawExamplesProps } from "@/components/law-examples";
import { learningTopics } from "./learning";
import { learningSourceChanged } from "./learning-source";

export function getLawExamples(
  recordId: string,
  headings: ArticleHeading[],
): LawExamplesProps | null {
  const library = getLibrary();
  const law = library.laws.find(
    (item) => findLearningLaw(item.id)?.id === recordId,
  );
  if (!law) return null;
  const record = findLearningLaw(law.id)!;
  const articles = library.articles.filter(
    (article) => article.lawId === law.id,
  );
  // Legacy examples without a practice pin only have a saved law citation.
  // Their fallback detects version changes, not same-version body changes.
  const available = articles.filter(
    (article) =>
      !learningSourceChanged(article.practice ?? law, record) &&
      headings.some((heading) => heading.id === `clan-${article.number}`),
  );
  const heldExamples = articles
    .filter((article) => !available.includes(article))
    .reduce((count, article) => count + article.examples.length, 0);
  const examples = available.flatMap((article) =>
    article.examples.map((example) => ({
      article: { number: article.number, id: article.id },
      example,
      sourceHref: `#clan-${article.number}`,
    })),
  );
  return examples.length || heldExamples
    ? {
        law: { shortTitle: law.shortTitle },
        examples,
        heldExamples,
        learningHref: learningTopics.some((t) => t.lawId === law.id)
          ? `/ucenje?tema=${learningTopics.find((t) => t.lawId === law.id)!.id}`
          : undefined,
      }
    : null;
}
