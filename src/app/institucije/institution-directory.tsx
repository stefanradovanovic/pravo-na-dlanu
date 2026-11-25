"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  filterInstitutionGroups,
  type InstitutionGroup,
  type InstitutionProfile,
} from "@/lib/institution-directory";
import { InstitutionSources } from "./institution-sources";
import { useInstitutionFragment } from "./use-institution-fragment";

function profileAnchor(id: string) {
  return `institucija-${id}`;
}

function ProfileCard({ profile }: { profile: InstitutionProfile }) {
  return (
    <article className="institution-profile">
      <h3 id={profileAnchor(profile.id)} tabIndex={-1}>
        {profile.name}
      </h3>
      <p>{profile.summary}</p>
      <ul className="institution-duties" aria-label="Изабране надлежности">
        {profile.duties.map((duty) => (
          <li key={duty}>{duty}</li>
        ))}
      </ul>
      <footer>
        <InstitutionSources sources={profile.sources} />
        {profile.mapId && (
          <a className="text-link" href={`#${profile.mapId}`}>
            На интерактивној мапи
          </a>
        )}
      </footer>
    </article>
  );
}

export function InstitutionDirectory({
  groups,
}: {
  groups: readonly InstitutionGroup[];
}) {
  const [query, setQuery] = useState("");
  const fragment = useInstitutionFragment();
  const visibleGroups = filterInstitutionGroups(groups, query);
  const searching = visibleGroups !== groups;
  const activeGroup =
    groups.find(
      ({ id, profiles }) =>
        id === fragment ||
        profiles.some((profile) => profileAnchor(profile.id) === fragment),
    ) ?? groups[0];
  const count = visibleGroups.reduce(
    (sum, group) => sum + group.profiles.length,
    0,
  );

  return (
    <section
      className="institution-directory"
      aria-label="Преглед институција"
      data-searching={searching || undefined}
    >
      <div
        className="institution-directory-sidebar"
        id="pregled-institucija"
        tabIndex={-1}
      >
        <div role="search" aria-label="Претрага институција">
          <div className="relative">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="Пронађи институцију"
              className="ps-9"
              type="search"
              value={query}
              onValueChange={setQuery}
              placeholder="Назив или надлежност"
            />
          </div>
        </div>
        {visibleGroups.length > 0 && (
          <nav
            className="institution-group-links"
            aria-label="Области прегледа"
          >
            {visibleGroups.map(({ id, title, description, profiles }) => (
              <details
                className="institution-group-index"
                name="institution-directory-groups"
                data-current={
                  (!searching && fragment !== null && activeGroup?.id === id) ||
                  undefined
                }
                key={id}
              >
                <summary
                  aria-label={`Списак институција — ${title}`}
                  aria-describedby={`opis-${id}`}
                  className={buttonVariants({
                    variant: "ghost",
                    className: "institution-group-link",
                  })}
                >
                  <span>
                    <strong>
                      {id === "ministarstva" && !searching
                        ? `${title} (${profiles.length})`
                        : title}
                    </strong>
                    <span id={`opis-${id}`}>{description}</span>
                  </span>
                  <ChevronDown aria-hidden="true" />
                </summary>
                <ul>
                  <li>
                    <a
                      aria-current={fragment === id ? "location" : undefined}
                      aria-label={`Преглед области — ${title}`}
                      className="text-link"
                      href={`#${id}`}
                    >
                      Преглед области
                    </a>
                  </li>
                  {profiles.map((profile) => {
                    const anchor = profileAnchor(profile.id);
                    return (
                      <li key={profile.id}>
                        <a
                          aria-current={
                            fragment === anchor ? "location" : undefined
                          }
                          className="text-link"
                          href={`#${anchor}`}
                        >
                          {profile.name}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </nav>
        )}
      </div>
      <div className="institution-directory-content">
        <p className="institution-search-status" role="status">
          {searching &&
            (count === 0
              ? "Нема резултата за овај упит."
              : `Број резултата: ${count}`)}
        </p>
        <div className="institution-groups">
          {visibleGroups.map((group) => (
            <section
              className="institution-group"
              key={group.id}
              aria-labelledby={group.id}
            >
              <header>
                <h2 id={group.id} tabIndex={-1}>
                  {group.title}
                </h2>
                <p>{group.description}.</p>
                {group.source && (
                  <InstitutionSources sources={[group.source]} />
                )}
              </header>
              <div className="institution-profiles">
                {group.profiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            </section>
          ))}
        </div>
        {!searching && (
          <a
            className="text-link institution-map-link"
            href="#veze-institucija"
          >
            Погледај везе између институција
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  );
}
