"use client";
import { Info } from "lucide-react";
import type { Article, Example, Law } from "@/lib/types";
import { ExampleCard } from "./example-card";
import { buttonVariants } from "./ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type LawExamplesProps = {
  learningHref?: string;
  law: Pick<Law, "shortTitle">;
  examples: {
    article: Pick<Article, "id" | "number">;
    example: Example;
    sourceHref?: string;
  }[];
};
export function LawExamples({ law, examples, learningHref }: LawExamplesProps) {
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
      {learningHref && (
        <div className="reader-learning-link">
          <span>Примените правило на кратку животну ситуацију.</span>
          <a
            href={learningHref}
            className={buttonVariants({ variant: "outline" })}
          >
            Учи и провери знање →
          </a>
        </div>
      )}
      <Accordion>
        <AccordionItem value="examples">
          <AccordionTrigger>
            Примери из живота · {examples.length}
          </AccordionTrigger>
          <AccordionContent>
            <div className="examples-grid">
              {examples.map(({ article, example, sourceHref }, index) => (
                <ExampleCard
                  key={`${article.id}-${index}`}
                  article={article}
                  example={example}
                  law={law}
                  index={index}
                  sourceHref={sourceHref}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
