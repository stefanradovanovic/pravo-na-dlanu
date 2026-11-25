"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { CourtDirectoryData } from "@/lib/court-directory";
import {
  filterInstitutionGroups,
  type InstitutionGroup,
  type InstitutionProfile,
} from "@/lib/institution-directory";
import type { ProsecutionDirectoryData } from "@/lib/prosecution-directory";
import { CourtDirectory } from "./court-directory";
import { InstitutionContactDetails } from "./institution-contact-details";
import { InstitutionSearchInput } from "./institution-search-input";
import { InstitutionSources } from "./institution-sources";
import { ProsecutionDirectory } from "./prosecution-directory";
import { useInstitutionFragment } from "./use-institution-fragment";

function profileAnchor(id: string) {
  return `institucija-${id}`;
}

function ProfileCard({
  profile,
  children,
}: {
  profile: InstitutionProfile;
  children?: ReactNode;
}) {
  const { contact } = profile;
  const contactTitle = contact?.title ?? "Контакт";
  const contactAnchor = `${profileAnchor(profile.id)}-kontakt`;
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
      {contact && (
        <section
          className="institution-profile-contact"
          aria-labelledby={contactAnchor}
        >
          <h4 id={contactAnchor}>{contactTitle}</h4>
          <InstitutionContactDetails
            contact={contact.details}
            name={contact.title ?? profile.name}
          />
          {contact.directory && (
            <a className="text-link" href={contact.directory.href}>
              {contact.directory.title}
            </a>
          )}
        </section>
      )}
      <footer>
        <InstitutionSources sources={profile.sources} />
      </footer>
      {children}
    </article>
  );
}

export function InstitutionDirectory({
  groups,
  courts,
  prosecutions,
}: {
  groups: readonly InstitutionGroup[];
  courts: CourtDirectoryData;
  prosecutions: ProsecutionDirectoryData;
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
          <InstitutionSearchInput
            label="Пронађи институцију"
            placeholder="Назив или надлежност"
            value={query}
            onValueChange={setQuery}
          />
        </div>
        {visibleGroups.length > 0 && (
          <nav
            className="institution-group-links"
            aria-label="Области прегледа"
          >
            {visibleGroups.map(({ id, title, description, profiles }) => (
              <details
                className="institution-group-index institution-disclosure"
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
                  <ProfileCard key={profile.id} profile={profile}>
                    {profile.id === "sudovi" && (
                      <CourtDirectory data={courts} />
                    )}
                    {profile.id === "javno-tuzilastvo" && (
                      <ProsecutionDirectory data={prosecutions} />
                    )}
                  </ProfileCard>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
