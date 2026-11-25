"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  indexGlossary,
  matchingGlossaryEntries,
  type GlossaryEntry,
  type GlossarySource,
  type GlossaryTopic,
} from "@/lib/glossary";

function Entry({
  entry,
  sources,
}: {
  entry: GlossaryEntry;
  sources: Record<string, GlossarySource>;
}) {
  return (
    <article
      id={`pojam-${entry.id}`}
      className="glossary-entry"
      aria-labelledby={`naslov-${entry.id}`}
    >
      <h3 id={`naslov-${entry.id}`}>{entry.title}</h3>
      <p>{entry.definition}</p>
      {entry.distinction && (
        <p className="glossary-context">{entry.distinction}</p>
      )}
      <details>
        <summary>{entry.example ? "Пример и извори" : "Извори"}</summary>
        {entry.example && (
          <p className="glossary-example">
            <strong>Уреднички пример</strong>
            <br />
            {entry.example}
          </p>
        )}
        <ul className="glossary-sources" aria-label="Извори">
          {entry.references.map(({ source, label }) => {
            const { url, lawHref, version, accessedAt, needsReview } =
              sources[source];
            return (
              <li key={label}>
                <a className="text-link" href={lawHref ?? url}>
                  {label}
                </a>
                {lawHref && (
                  <>
                    {" "}
                    ·{" "}
                    <a className="text-link" href={url}>
                      ПИС
                    </a>
                  </>
                )}
                {version && (
                  <small>
                    {version}
                    {accessedAt && (
                      <>
                        {" "}
                        · Преузето{" "}
                        <time dateTime={accessedAt}>
                          {accessedAt.split("-").reverse().join(".")}.
                        </time>
                      </>
                    )}
                  </small>
                )}
                {needsReview && (
                  <small>
                    Извор се променио или више није у збирци. Одредница се
                    ослања на наведену верзију.
                  </small>
                )}
              </li>
            );
          })}
        </ul>
      </details>
    </article>
  );
}

export function GlossaryBrowser({
  topics,
  sources,
}: {
  topics: GlossaryTopic[];
  sources: Record<string, GlossarySource>;
}) {
  const [query, setQuery] = useState("");
  const [topicId, setTopicId] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const index = useMemo(() => indexGlossary(topics), [topics]);
  const matches = matchingGlossaryEntries(index, query, topicId);
  const matchingIds = new Set(matches.map(({ entry }) => entry.id));
  const topicOptions = [
    { value: "", label: "Све теме" },
    ...topics.map(({ id, title }) => ({ value: id, label: title })),
  ];

  return (
    <div className="learning-workspace glossary-workspace">
      <div className="glossary-filters">
        <div>
          <label htmlFor="recnik-search">Претражи речник</label>
          <Input
            id="recnik-search"
            type="search"
            ref={searchInput}
            value={query}
            onValueChange={setQuery}
            placeholder="На пример, жалба"
          />
        </div>
        <div>
          <label id="recnik-topic-label" htmlFor="recnik-topic">
            Тема
          </label>
          <Select
            items={topicOptions}
            value={topicId}
            multiple={false}
            onValueChange={(value) => setTopicId(value ?? "")}
          >
            <SelectTrigger
              id="recnik-topic"
              aria-labelledby="recnik-topic-label"
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {topicOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <noscript>
        <p>За претрагу и избор теме укључите JavaScript.</p>
      </noscript>
      <div className="glossary-results-bar">
        <p className="learning-caption" role="status">
          Приказано {matches.length} од {index.length} одредница.
        </p>
        {(query || topicId) && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery("");
              setTopicId("");
              searchInput.current?.focus();
            }}
          >
            Прикажи све одреднице
          </Button>
        )}
      </div>
      {matches.length === 0 && (
        <p>
          Нема одредница за ову претрагу. Пробајте краћи појам или другу тему.
        </p>
      )}
      {topics.map((topic) => {
        const entries = topic.entries.filter((entry) =>
          matchingIds.has(entry.id),
        );
        if (!entries.length) return null;
        return (
          <section
            key={topic.id}
            className="glossary-topic"
            aria-labelledby={`tema-${topic.id}`}
          >
            <h2 id={`tema-${topic.id}`}>{topic.title}</h2>
            {entries.map((entry) => (
              <Entry key={entry.id} entry={entry} sources={sources} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
