"use client";

import { useState } from "react";
import type { CourtDirectoryData, CourtGroup } from "@/lib/court-directory";
import { normalizeCourtSearch, searchCourtGroups } from "@/lib/court-search";
import { InstitutionSearchInput } from "./institution-search-input";
import { InstitutionSources } from "./institution-sources";
import {
  TerritorialEntryList,
  TerritorialGroup,
  UpcomingTerritorialChange,
} from "./territorial-directory-parts";

type CourtTransition = NonNullable<CourtDirectoryData["transition"]>;

function CourtGroupView({
  group,
  searching,
  place,
  transition,
}: {
  group: CourtGroup;
  searching: boolean;
  place?: string;
  transition?: CourtTransition;
}) {
  return (
    <TerritorialGroup
      title={group.title}
      count={group.courts.length}
      description={group.responsibility}
      heading={group.jurisdiction === "supreme" ? "h5" : "h6"}
      searching={searching}
    >
      <div className="territorial-group-content">
        {group.courts.length > 0 && (
          <TerritorialEntryList
            entries={group.courts}
            label="Судови"
            place={place}
            renderNote={
              searching && transition
                ? (name) => {
                    const change = transition.changes.find(
                      (change) =>
                        change.court === name &&
                        (!place || change.places.includes(place)),
                    );
                    return (
                      change && (
                        <UpcomingTerritorialChange
                          {...transition}
                          description={change.description}
                        />
                      )
                    );
                  }
                : undefined
            }
          />
        )}
        {group.departments && group.departments.length > 0 && (
          <div>
            <strong>Одељења ван седишта</strong>
            <TerritorialEntryList
              entries={group.departments}
              label="Одељења ван седишта"
              place={place}
            />
          </div>
        )}
        <InstitutionSources sources={group.sources} />
      </div>
    </TerritorialGroup>
  );
}

const jurisdictions = [
  { id: "supreme" },
  { id: "general", label: "Остали судови опште надлежности" },
  { id: "special", label: "Судови посебне надлежности" },
] as const;
const mitrovicaCourts =
  "Основни, Виши и Прекршајни суд у Косовској Митровици обухваћени су прелазним одредбама за АП Косово и Метохију.";
const mitrovicaSearchText = normalizeCourtSearch(
  `${mitrovicaCourts} Косовска Митровица`,
);

export function CourtDirectory({ data }: { data: CourtDirectoryData }) {
  const [query, setQuery] = useState("");
  const { transition } = data;
  const normalizedQuery = normalizeCourtSearch(query);
  const terms = normalizedQuery.split(" ");
  const showTerritorialScope =
    !normalizedQuery ||
    (terms.some(
      (term) => term.startsWith("kosov") || term.startsWith("mitrovic"),
    ) &&
      terms.every((term) => mitrovicaSearchText.includes(term)));
  const { groups, place } = searchCourtGroups(data.groups, normalizedQuery);
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
      className="territorial-directory"
      aria-labelledby="court-directory-title"
    >
      <header>
        <h4 id="court-directory-title">Списак судова и надлежности</h4>
        <p className="heading-description">
          Унесите назив суда, општине или града да видите који судови покривају
          то подручје и којим се предметима баве.
        </p>
        <p className="heading-description">
          <a
            className="text-link"
            href="https://www.vrh.sud.rs/sr/корисни-линкови"
          >
            Списак званичних сајтова судова
          </a>
        </p>
      </header>
      <div role="search" aria-label="Претрага судова">
        <InstitutionSearchInput
          label="Пронађи суд"
          placeholder="Назив суда, општина или град"
          value={query}
          onValueChange={setQuery}
        />
      </div>
      <p className="institution-search-status" role="status">
        {normalizedQuery
          ? count
            ? place
              ? `Судови и одељења за место „${place}“ · ${count}`
              : `Број резултата · ${count}`
            : showTerritorialScope
              ? "Судови из прелазних одредаба"
              : "Нема судова за овај упит."
          : `${count} судова у мрежи · приступ извору ${sourceDate}`}
      </p>
      <div className="court-groups">
        {jurisdictions.map((jurisdiction) => {
          const entries = groups.filter(
            (group) => group.jurisdiction === jurisdiction.id,
          );
          if (!entries.length) return null;
          return (
            <div className="court-jurisdiction" key={jurisdiction.id}>
              {"label" in jurisdiction && <h5>{jurisdiction.label}</h5>}
              {entries.map((group) => (
                <CourtGroupView
                  key={group.title}
                  group={group}
                  searching={Boolean(normalizedQuery)}
                  place={place}
                  transition={transition}
                />
              ))}
            </div>
          );
        })}
      </div>
      {(showTerritorialScope || (!normalizedQuery && transition)) && (
        <div className="court-directory-notes">
          {!normalizedQuery &&
            transition &&
            transition.changes.map((change) => (
              <UpcomingTerritorialChange
                key={change.court}
                {...transition}
                description={change.description}
              />
            ))}
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
