"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { CourtDirectoryData, CourtGroup } from "@/lib/court-directory";
import { normalizeSearch } from "@/lib/search";
import { InstitutionSearchInput } from "./institution-search-input";
import { InstitutionSources } from "./institution-sources";

function CourtList({
  entries,
  label,
}: {
  entries: CourtGroup["courts"];
  label: string;
}) {
  return (
    <ul className="court-list" aria-label={label}>
      {entries.map(({ name, area }) => (
        <li key={name}>
          <strong>{name}</strong>
          <p>{area}</p>
        </li>
      ))}
    </ul>
  );
}

function CourtGroupContent({ group }: { group: CourtGroup }) {
  return (
    <div className="court-group-content">
      {group.courts.length > 0 && (
        <CourtList entries={group.courts} label="Судови" />
      )}
      {group.departments && group.departments.length > 0 && (
        <div>
          <strong>Одељења ван седишта</strong>
          <CourtList entries={group.departments} label="Одељења ван седишта" />
        </div>
      )}
      <InstitutionSources sources={group.sources} />
    </div>
  );
}

const normalize = (value: string) =>
  normalizeSearch(value).replaceAll("dj", "d");
const mitrovicaCourts =
  "Основни, Виши и Прекршајни суд у Косовској Митровици обухваћени су прелазним одредбама за АП Косово и Метохију.";
const mitrovicaSearchText = normalize(`${mitrovicaCourts} Косовска Митровица`);

export function CourtDirectory({ data }: { data: CourtDirectoryData }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(" ");
  const showTerritorialScope =
    !normalizedQuery ||
    (terms.some(
      (term) => term.startsWith("kosov") || term.startsWith("mitrovic"),
    ) &&
      terms.every((term) => mitrovicaSearchText.includes(term)));
  const groups = normalizedQuery
    ? data.groups
        .map((group) => {
          const match = ({
            name,
            area,
            seat,
          }: CourtGroup["courts"][number]) => {
            const text = normalize(`${name} ${seat} ${area} ${group.title}`);
            return terms.every((term) => text.includes(term));
          };
          return {
            ...group,
            courts: group.courts.filter(match),
            departments: group.departments?.filter(match),
          };
        })
        .filter(
          ({ courts, departments }) => courts.length || departments?.length,
        )
    : data.groups;
  const count = groups.reduce(
    (total, group) =>
      total +
      group.courts.length +
      (normalizedQuery ? (group.departments?.length ?? 0) : 0),
    0,
  );
  const sourceDate = new Intl.DateTimeFormat("sr-Cyrl-RS", {
    timeZone: "UTC",
  }).format(new Date(data.sourceDate));

  return (
    <section
      className="court-directory"
      aria-labelledby="court-directory-title"
    >
      <header>
        <h4 id="court-directory-title">Списак судова и надлежности</h4>
        <p className="heading-description">
          Пронађите суд по називу или месту и погледајте за које предмете и
          подручје је надлежан.
        </p>
      </header>
      <div role="search" aria-label="Претрага судова">
        <InstitutionSearchInput
          label="Пронађи суд"
          placeholder="Назив суда или место"
          value={query}
          onValueChange={setQuery}
        />
      </div>
      <p className="institution-search-status" role="status">
        {normalizedQuery
          ? count
            ? `Број резултата · ${count}`
            : showTerritorialScope
              ? "Судови из прелазних одредаба"
              : "Нема судова за овај упит."
          : `${count} судова у мрежи · приступ извору ${sourceDate}`}
      </p>
      <div className="court-groups">
        {groups.map((group) =>
          normalizedQuery ? (
            <div key={group.title}>
              <h5>{group.title}</h5>
              <p className="heading-description">{group.responsibility}</p>
              <CourtGroupContent group={group} />
            </div>
          ) : (
            <details className="institution-disclosure" key={group.title}>
              <summary
                className={buttonVariants({
                  variant: "ghost",
                  className: "institution-group-link",
                })}
              >
                <span>
                  <strong>
                    {group.title}
                    {group.courts.length > 1 ? ` (${group.courts.length})` : ""}
                  </strong>
                  <span>{group.responsibility}</span>
                </span>
                <ChevronDown aria-hidden="true" />
              </summary>
              <CourtGroupContent group={group} />
            </details>
          ),
        )}
      </div>
      {(showTerritorialScope || (!normalizedQuery && data.transition)) && (
        <div className="court-directory-notes">
          {!normalizedQuery && data.transition && (
            <p>
              Од 1. марта 2027. Четврти основни суд у Београду преузима Земун и
              Сурчин, а Трећи основни суд задржава Нови Београд. Основни суд у
              Пожеги добија судску јединицу у Косјерићу.{" "}
              <a className="text-link" href={data.transition.href}>
                {data.transition.title}
              </a>
            </p>
          )}
          {showTerritorialScope && (
            <>
              <p>
                {mitrovicaCourts}{" "}
                {data.territorialScope.map(({ href, title }) => (
                  <a className="text-link me-2" href={href} key={href}>
                    {title}
                  </a>
                ))}
              </p>
              <p>
                Надлежности основног и вишег суда привремено су пренете на
                одговарајуће судове у Лесковцу, а надлежност прекршајног на
                Прекршајни суд у Прокупљу.{" "}
                <a
                  className="text-link"
                  href="https://www.vrh.sud.rs/sr/%D1%801-1052026-3201"
                >
                  Решење Врховног суда
                </a>
                {" · "}
                <a
                  className="text-link"
                  href="https://pkap.sud.rs/psudovi.html"
                >
                  Списак Прекршајног апелационог суда
                </a>
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
