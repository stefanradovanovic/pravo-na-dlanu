"use client";

import { useState } from "react";
import {
  normalizeCourtSearch,
  searchProsecutionGroups,
} from "@/lib/court-search";
import type { ProsecutionDirectoryData } from "@/lib/prosecution-directory";
import { InstitutionSearchInput } from "./institution-search-input";
import { InstitutionSources } from "./institution-sources";
import {
  TerritorialEntryList,
  TerritorialGroup,
  UpcomingTerritorialChange,
} from "./territorial-directory-parts";

const belgradeChangePlaces = ["Београд", "Земун", "Сурчин", "Нови Београд"];
const thirdOffice = "Треће основно јавно тужилаштво у Београду";

export function ProsecutionDirectory({
  data,
}: {
  data: ProsecutionDirectoryData;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeCourtSearch(query);
  const { groups, place } = searchProsecutionGroups(
    data.groups,
    normalizedQuery,
  );
  const count = groups.reduce(
    (total, { offices }) => total + offices.length,
    0,
  );
  const { transition } = data;
  const showTerritorialScope =
    !normalizedQuery || normalizedQuery.includes("kosov");

  return (
    <section
      className="territorial-directory"
      aria-labelledby="prosecution-directory-title"
    >
      <header>
        <h4 id="prosecution-directory-title">
          Списак јавних тужилаштава и подручја
        </h4>
        <p className="heading-description">
          Унесите назив тужилаштва, општине или града да видите која тужилаштва
          покривају то подручје.
        </p>
      </header>
      <div role="search" aria-label="Претрага јавних тужилаштава">
        <InstitutionSearchInput
          label="Пронађи јавно тужилаштво"
          placeholder="Назив тужилаштва, општина или град"
          value={query}
          onValueChange={setQuery}
        />
      </div>
      <p className="institution-search-status" role="status">
        {place
          ? `Јавна тужилаштва за место „${place}“ · ${count}`
          : normalizedQuery
            ? count
              ? `Број резултата · ${count}`
              : "Нема јавних тужилаштава за овај упит."
            : `${count} јавних тужилаштава у мрежи`}
      </p>
      <div>
        {groups.map((group) => (
          <TerritorialGroup
            key={group.title}
            title={group.title}
            count={group.offices.length}
            searching={Boolean(normalizedQuery)}
          >
            <div className="territorial-group-content">
              <TerritorialEntryList
                entries={group.offices}
                label={group.title}
                place={place}
                renderNote={
                  transition && (!place || belgradeChangePlaces.includes(place))
                    ? (name) =>
                        name === thirdOffice && (
                          <UpcomingTerritorialChange
                            {...transition}
                            description="Четврто основно јавно тужилаштво у Београду преузима Земун и Сурчин. Треће основно јавно тужилаштво остаје надлежно за Нови Београд."
                          />
                        )
                    : undefined
                }
              />
              <InstitutionSources sources={group.sources} />
            </div>
          </TerritorialGroup>
        ))}
      </div>
      {showTerritorialScope && (
        <div className="court-directory-notes">
          <p>
            За јавна тужилаштва на територији АП Косово и Метохија примењују се
            посебне и прелазне одредбе.
          </p>
          <InstitutionSources sources={data.territorialScope} />
        </div>
      )}
    </section>
  );
}
