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
import {
  MinistryContacts,
  MinistryOverview,
  MinistrySources,
  SourceAccessDate,
} from "./ministry-profile";
import { ProsecutionDirectory } from "./prosecution-directory";
import { useInstitutionFragment } from "./use-institution-fragment";

function profileAnchor(id: string) {
  return `institucija-${id}`;
}

function ProfileIndexLinks({
  profiles,
  fragment,
}: {
  profiles: readonly InstitutionProfile[];
  fragment: string | null;
}) {
  return profiles.map((profile) => {
    const anchor = profileAnchor(profile.id);
    return (
      <li key={profile.id}>
        <a
          aria-current={fragment === anchor ? "location" : undefined}
          className="text-link"
          href={`#${anchor}`}
        >
          {profile.indexName ?? profile.name}
        </a>
      </li>
    );
  });
}

function ProfileCard({
  profile,
  children,
  onNavigate,
  headingLevel = "h3",
}: {
  profile: InstitutionProfile;
  children?: ReactNode;
  onNavigate?: () => void;
  headingLevel?: "h3" | "h4";
}) {
  const { contact, ministryDetails: details } = profile;
  const contactTitle = contact?.title ?? "Контакт";
  const contactAnchor = `${profileAnchor(profile.id)}-kontakt`;
  const Heading = headingLevel;
  const heading = (
    <Heading id={profileAnchor(profile.id)} tabIndex={-1}>
      {profile.name}
    </Heading>
  );
  const description = (
    <div className="institution-profile-description">
      <p>{profile.summary}</p>
      {profile.duties.length > 0 && (
        <ul className="institution-duties" aria-label="Изабране надлежности">
          {profile.duties.map((duty) => (
            <li key={duty}>{duty}</li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <article className="institution-profile">
      {details ? (
        <MinistryOverview minister={details.minister} heading={heading}>
          {description}
        </MinistryOverview>
      ) : (
        <header className="institution-profile-overview">
          {heading}
          {description}
        </header>
      )}
      {profile.leadership && (
        <section className="institution-profile-contact">
          <h4>{profile.leadership.heading}</h4>
          <p>{profile.leadership.description}</p>
          {profile.leadership.links.map((link) => (
            <a
              key={link.href}
              className="text-link"
              href={link.href}
              onClick={link.href.startsWith("#") ? onNavigate : undefined}
            >
              {link.title}
            </a>
          ))}
          <InstitutionSources sources={profile.leadership.sources} />
          <small>
            <SourceAccessDate accessedAt={profile.leadership.accessedAt} />
          </small>
        </section>
      )}
      {details && <MinistryContacts details={details} />}
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
        {details && <MinistrySources details={details} />}
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
      ({ id, profiles, subsection }) =>
        id === fragment ||
        subsection?.id === fragment ||
        profiles.some((profile) => profileAnchor(profile.id) === fragment) ||
        subsection?.profiles.some(
          (profile) => profileAnchor(profile.id) === fragment,
        ),
    ) ?? groups[0];
  const count = visibleGroups.reduce(
    (sum, group) =>
      sum + group.profiles.length + (group.subsection?.profiles.length ?? 0),
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
            placeholder="Назив, надлежност или министар"
            value={query}
            onValueChange={setQuery}
          />
        </div>
        {visibleGroups.length > 0 && (
          <nav
            className="institution-group-links"
            aria-label="Области прегледа"
          >
            {visibleGroups.map(
              ({ id, title, description, profiles, subsection }) => (
                <details
                  className="institution-group-index institution-disclosure"
                  name="institution-directory-groups"
                  data-current={
                    (!searching &&
                      fragment !== null &&
                      activeGroup?.id === id) ||
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
                          ? `${title} (${profiles.length}${subsection ? ` + ${subsection.profiles.length}` : ""})`
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
                    <ProfileIndexLinks
                      profiles={profiles}
                      fragment={fragment}
                    />
                    {subsection && (
                      <li className="institution-index-subsection">
                        <a
                          aria-current={
                            fragment === subsection.id ? "location" : undefined
                          }
                          className="text-link"
                          href={`#${subsection.id}`}
                        >
                          {subsection.title}
                        </a>
                        <ul>
                          <ProfileIndexLinks
                            profiles={subsection.profiles}
                            fragment={fragment}
                          />
                        </ul>
                      </li>
                    )}
                  </ul>
                </details>
              ),
            )}
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
                {group.note && (
                  <div className="institution-group-note">
                    <p>{group.note.text}</p>
                    <p>
                      <a className="text-link" href={group.note.source.href}>
                        {group.note.source.title}
                      </a>
                      {" · "}
                      <SourceAccessDate accessedAt={group.note.accessedAt} />
                    </p>
                  </div>
                )}
              </header>
              {group.profiles.length > 0 && (
                <div className="institution-profiles">
                  {group.profiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      onNavigate={() => setQuery("")}
                    >
                      {profile.id === "sudovi" && (
                        <CourtDirectory data={courts} />
                      )}
                      {profile.id === "javno-tuzilastvo" && (
                        <ProsecutionDirectory data={prosecutions} />
                      )}
                    </ProfileCard>
                  ))}
                </div>
              )}
              {group.subsection && (
                <section
                  className="institution-subsection"
                  aria-labelledby={group.subsection.id}
                >
                  <header>
                    <h3 id={group.subsection.id} tabIndex={-1}>
                      {group.subsection.title}
                    </h3>
                    <p>{group.subsection.description}.</p>
                    {group.subsection.source && (
                      <InstitutionSources sources={[group.subsection.source]} />
                    )}
                  </header>
                  <div className="institution-profiles">
                    {group.subsection.profiles.map((profile) => (
                      <ProfileCard
                        key={profile.id}
                        profile={profile}
                        headingLevel="h4"
                      />
                    ))}
                  </div>
                </section>
              )}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
