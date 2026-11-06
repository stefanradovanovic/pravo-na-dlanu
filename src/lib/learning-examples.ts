import { getLibrary } from "./content";
import { findLearningLaw } from "./registry";
import type { ArticleHeading } from "./document-navigation";
import type { LawExamplesProps } from "@/components/law-examples";

export function getLawExamples(
  recordId: string,
  headings: ArticleHeading[],
): LawExamplesProps | null {
  const library = getLibrary();
  const law = library.laws.find(
    (item) => findLearningLaw(item.id)?.id === recordId,
  );
  if (!law) return null;
  const examples = library.articles
    .filter((article) => article.lawId === law.id)
    .flatMap((article) =>
      article.examples.map((example) => ({
        article: { number: article.number, id: article.id },
        example,
        sourceHref: headings.some(
          (heading) => heading.id === `clan-${article.number}`,
        )
          ? `#clan-${article.number}`
          : undefined,
      })),
    );
  return examples.length
    ? { law: { shortTitle: law.shortTitle }, examples }
    : null;
}
