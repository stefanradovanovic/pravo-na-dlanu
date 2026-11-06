"use client";
import { useState } from "react";
import { ArrowUpRight, Check, Lightbulb, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Article, Example, Law } from "@/lib/types";

export function ExampleCard({
  example,
  article,
  law,
  index = 0,
  sourceHref,
}: {
  example: Example;
  article: Pick<Article, "number">;
  law: Pick<Law, "shortTitle">;
  index?: number;
  sourceHref?: string;
}) {
  const [answer, setAnswer] = useState<boolean | null>(null);
  return (
    <article className="example-card">
      <div className="example-top">
        <span>СИТУАЦИЈА {String(index + 1).padStart(2, "0")}</span>
        <Badge variant="outline">Измишљен пример</Badge>
      </div>
      <h3>{example.title}</h3>
      <p>{example.scenario}</p>
      <div className="quiz">
        <strong>Да ли ово крши описано правило?</strong>
        <div className="quiz-actions">
          <Button
            variant={answer === true ? "default" : "outline"}
            onClick={() => setAnswer(true)}
          >
            Да, крши
          </Button>
          <Button
            variant={answer === false ? "default" : "outline"}
            onClick={() => setAnswer(false)}
          >
            Не, само по себи
          </Button>
        </div>
      </div>
      {answer !== null && (
        <div className="quiz-answer" role="status">
          <strong>
            {answer === example.violation ? (
              <Check size={17} />
            ) : (
              <Lightbulb size={17} />
            )}{" "}
            {answer === example.violation
              ? "Тачно — ево зашто."
              : "Погледајмо правило пажљивије."}
          </strong>
          <p>{example.explanation}</p>
          <Button variant="ghost" size="sm" onClick={() => setAnswer(null)}>
            <RotateCcw /> Покушај поново
          </Button>
        </div>
      )}
      {sourceHref ? (
        <a className="example-source" href={sourceHref}>
          {law.shortTitle} · правило из члана {article.number}
          <ArrowUpRight size={15} />
        </a>
      ) : (
        <p className="example-source">
          {law.shortTitle} · правило из члана {article.number}
        </p>
      )}
    </article>
  );
}
