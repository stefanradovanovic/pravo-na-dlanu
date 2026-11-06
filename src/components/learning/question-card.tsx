"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Lightbulb, Search, Shuffle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LearningQuestion } from "@/lib/learning";
import { SourceDetails } from "./source-details";

export function QuestionCard({
  question,
  answer,
  index,
  count,
  onSubmit,
  onNext,
}: {
  question: LearningQuestion;
  answer?: string;
  index: number;
  count: number;
  onSubmit: (choice: string) => void;
  onNext: () => void;
}) {
  const [selected, setSelected] = useState(answer ?? "");
  const heading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    if (answer) feedback.current?.focus();
  }, [answer]);
  const correct = answer === question.correctChoiceId;
  const chosen = question.choices.find((c) => c.id === answer);
  const right = question.choices.find(
    (c) => c.id === question.correctChoiceId,
  )!;
  return (
    <article className="learning-question" aria-labelledby="question-title">
      <div className="learning-row">
        <span className="eyebrow">
          ПИТАЊЕ {index + 1} ОД {count}
        </span>
        <Badge variant="outline">Измишљен пример</Badge>
      </div>
      <progress
        className="learning-progress"
        aria-label="Ток сесије"
        value={index}
        max={count}
      />
      {question.kind === "what-if" && (
        <div className="learning-change">
          <strong>
            <Shuffle size={17} /> Шта ако променимо једну чињеницу?
          </strong>
          <p>{question.change}</p>
          <details>
            <summary>Подсети се првобитне ситуације</summary>
            <p>{question.originalScenario}</p>
          </details>
        </div>
      )}
      <h2 id="question-title" ref={heading} tabIndex={-1}>
        {question.title}
      </h2>
      <p className="learning-scenario">{question.scenario}</p>
      {question.kind === "research" && (
        <div className="learning-research">
          <p>
            Истражите извор, па се вратите на питање. Везе се отварају у новом
            језичку.
          </p>
          <div className="learning-actions">
            <a
              className={buttonVariants({ variant: "outline" })}
              href={`/?q=${encodeURIComponent(question.source.title)}&view=list`}
              target="_blank"
              rel="noreferrer"
            >
              <Search /> Претражи збирку
            </a>
            <a
              className={buttonVariants({ variant: "ghost" })}
              href={question.source.lawHref}
              target="_blank"
              rel="noreferrer"
            >
              Отвори закон ↗
            </a>
          </div>
          <details>
            <summary>Мала помоћ</summary>
            <p>{question.hint}</p>
          </details>
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (selected && !answer) onSubmit(selected);
        }}
      >
        <fieldset disabled={!!answer}>
          <legend>{question.prompt}</legend>
          <div
            className="learning-choices"
            role="group"
            aria-label="Понуђени одговори"
          >
            {question.choices.map((choice, i) => (
              <Button
                key={choice.id}
                type="button"
                variant={selected === choice.id ? "default" : "outline"}
                aria-pressed={selected === choice.id}
                onClick={() => setSelected(choice.id)}
                className="h-auto min-h-11 w-full justify-start whitespace-normal py-3 text-left"
              >
                <span aria-hidden="true">{["А", "Б", "В", "Г"][i]}.</span>{" "}
                {choice.text}
              </Button>
            ))}
          </div>
        </fieldset>
        {!answer && (
          <Button type="submit" size="lg" disabled={!selected}>
            Провери одговор <ArrowRight />
          </Button>
        )}
      </form>
      {answer && (
        <div
          className="learning-feedback"
          ref={feedback}
          tabIndex={-1}
          aria-label="Објашњење одговора"
        >
          <div className="learning-feedback-title">
            {correct ? <Check /> : <Lightbulb />}
            <h3>{correct ? "Тачно — ево зашто." : "Хајде да разјаснимо."}</h3>
          </div>
          <p>{chosen?.explanation}</p>
          {!correct && (
            <div className="learning-correct">
              <strong>Тачан одговор: {right.text}</strong>
              <p>{right.explanation}</p>
            </div>
          )}
          <Accordion>
            <AccordionItem value="alternatives">
              <AccordionTrigger>
                Зашто остали одговори нису тачни?
              </AccordionTrigger>
              <AccordionContent>
                {question.choices
                  .filter((c) => c.id !== question.correctChoiceId)
                  .map((c) => (
                    <div className="learning-alternative" key={c.id}>
                      <strong>{c.text}</strong>
                      <p>{c.explanation}</p>
                    </div>
                  ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <SourceDetails source={question.source} />
          <Button onClick={onNext} size="lg">
            {index + 1 === count ? "Погледај резултат" : "Следеће питање"}{" "}
            <ArrowRight />
          </Button>
        </div>
      )}
    </article>
  );
}
