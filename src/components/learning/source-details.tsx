import { ArrowUpRight, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { LearningSource } from "@/lib/learning";

export function SourceDetails({ source }: { source: LearningSource }) {
  return (
    <div className="learning-source">
      <a
        className={buttonVariants({ variant: "outline" })}
        href={source.href}
        target="_blank"
        rel="noreferrer"
      >
        <BookOpen /> Прочитај члан {source.article} <ArrowUpRight />
      </a>
      <span className="learning-caption">
        Цео закон се отвара у новом језичку.
      </span>
      <details>
        <summary>Извор, верзија и обухват</summary>
        <p>{source.version}</p>
        <p>
          <a href="/vodic#pojam-verzija" className="text-link">
            Како читати верзију извора?
          </a>
        </p>
        <p>
          Извор преузет: {source.accessedAt}. Поређење са извором за питања:{" "}
          {source.checkedAt}.
        </p>
        <p>
          {source.coverage} Датуми нису потврда правног важења нити стручна
          рецензија.
        </p>
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="text-link"
        >
          Отвори званични ПИС извор ↗
        </a>
      </details>
    </div>
  );
}
