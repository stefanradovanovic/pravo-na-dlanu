"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  filterInstitutionGroups,
  type InstitutionGroup,
  type InstitutionProfile,
} from "@/lib/institution-directory";
import { InstitutionSources } from "./institution-sources";

function ProfileCard({ profile }: { profile: InstitutionProfile }) {
  return (
    <article className="institution-profile">
      <h4 id={`institucija-${profile.id}`} tabIndex={-1}>
        {profile.name}
      </h4>
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
  const visibleGroups = filterInstitutionGroups(groups, query);
  const count = visibleGroups.reduce(
    (sum, group) => sum + group.profiles.length,
    0,
  );

  return (
    <section
      className="institution-directory"
      aria-labelledby="pregled-institucija"
    >
      <header className="institution-section-heading">
        <h2 id="pregled-institucija" tabIndex={-1}>
          Преглед институција
        </h2>
        <p>
          Кључне надлежности државних органа и министарстава, са изворима у
          прописима.
        </p>
      </header>
      <div
        className="institution-directory-search"
        role="search"
        aria-label="Преглед институција"
      >
        <label htmlFor="institution-search">Пронађи институцију</label>
        <Input
          id="institution-search"
          type="search"
          value={query}
          onValueChange={setQuery}
          placeholder="Нпр. пасош, просвета, буџет"
        />
      </div>
      <p className="institution-search-status" role="status">
        {visibleGroups !== groups &&
          (count === 0
            ? "Нема резултата за овај упит."
            : `Број резултата: ${count}`)}
      </p>
      {visibleGroups.length > 0 && (
        <nav className="institution-group-links" aria-label="Области прегледа">
          {visibleGroups.map((group) => (
            <a className="text-link" key={group.id} href={`#${group.id}`}>
              {group.title}
            </a>
          ))}
        </nav>
      )}
      {visibleGroups.map((group) => (
        <section
          className="institution-group"
          key={group.id}
          aria-labelledby={group.id}
        >
          <header>
            <h3 id={group.id} tabIndex={-1}>
              {group.title}
            </h3>
            {group.source && (
              <a className="text-link" href={group.source.href}>
                {group.source.title}
              </a>
            )}
          </header>
          <div className="institution-card-grid">
            {group.profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
