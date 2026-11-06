import { Info } from "lucide-react";
import { getLibrary } from "@/lib/content";
import { findLearningLaw } from "@/lib/registry";
import type { ArticleHeading } from "@/lib/document-navigation";
import { ExampleCard } from "./example-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function LawExamples({
  recordId,
  headings,
}: {
  recordId: string;
  headings: ArticleHeading[];
}) {
  const library = getLibrary();
  const law = library.laws.find(
    (item) => findLearningLaw(item.id)?.id === recordId,
  );
  if (!law) return null;
  const examples = library.articles
    .filter((article) => article.lawId === law.id)
    .flatMap((article) =>
      article.examples.map((example) => ({ article, example })),
    );
  if (!examples.length) return null;

  return (
    <section
      id="primeri-iz-zivota"
      className="law-examples"
      aria-label="Примери из живота"
    >
      <div className="educational-note">
        <Info size={16} />
        <p>
          <strong>Напомена о примерима:</strong> Измишљени, поједностављени
          примери служе учењу и нису правни савет нити део текста закона.
          Објашњења су машински припремљени уреднички нацрти, без стручне правне
          рецензије. Не утврђују одговорност стварне особе; за конкретан случај
          обратите се квалификованом правном стручњаку.
        </p>
      </div>
      <Accordion>
        <AccordionItem value="examples">
          <AccordionTrigger>
            Примери из живота · {examples.length}
          </AccordionTrigger>
          <AccordionContent>
            <div className="examples-grid">
              {examples.map(({ article, example }, index) => (
                <ExampleCard
                  key={`${article.id}-${index}`}
                  article={article}
                  example={example}
                  law={law}
                  index={index}
                  sourceHref={
                    headings.some(
                      (heading) => heading.id === `clan-${article.number}`,
                    )
                      ? `#clan-${article.number}`
                      : undefined
                  }
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
