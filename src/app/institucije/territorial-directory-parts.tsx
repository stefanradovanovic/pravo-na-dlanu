import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { InstitutionContact } from "@/lib/institution-directory";
import type { InstitutionSource } from "@/lib/institution-map";
import { InstitutionContactDetails } from "./institution-contact-details";

export const formatDirectoryDate = (date: string) =>
  new Intl.DateTimeFormat("sr-Cyrl-RS", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(date));

export function UpcomingTerritorialChange({
  effectiveDate,
  description,
  source,
}: {
  effectiveDate: string;
  description: string;
  source: InstitutionSource;
}) {
  return (
    <p className="territorial-change">
      <strong>
        Промена ·{" "}
        <time dateTime={effectiveDate}>
          {formatDirectoryDate(effectiveDate)}
        </time>
      </strong>{" "}
      {description}{" "}
      <a className="text-link" href={source.href}>
        {source.title}
      </a>
    </p>
  );
}

export function TerritorialEntryList({
  entries,
  label,
  place,
  renderNote,
}: {
  entries: {
    name: string;
    area: string;
    places: string[] | null;
    contact?: InstitutionContact;
  }[];
  label: string;
  place?: string;
  renderNote?: (name: string) => ReactNode;
}) {
  return (
    <ul className="territorial-list" aria-label={label}>
      {entries.map(({ name, area, places, contact }) => (
        <li key={name} className="[&>p]:leading-snug">
          <strong>{name}</strong>
          {place && places && !area.includes(place) && (
            <p>Подручје обухвата место „{place}“.</p>
          )}
          <p>{area}</p>
          {renderNote?.(name)}
          {contact && (
            <InstitutionContactDetails contact={contact} name={name} />
          )}
        </li>
      ))}
    </ul>
  );
}

export function TerritorialGroup({
  title,
  count,
  searching,
  description,
  heading: Heading = "h5",
  children,
}: {
  title: string;
  count: number;
  searching: boolean;
  description?: string;
  heading?: "h5" | "h6";
  children: ReactNode;
}) {
  if (searching) {
    return (
      <div className="territorial-group territorial-group-result">
        <Heading>{title}</Heading>
        {description && <p className="heading-description">{description}</p>}
        {children}
      </div>
    );
  }
  return (
    <details className="territorial-group institution-disclosure">
      <summary
        className={buttonVariants({
          variant: "ghost",
          className: "institution-group-link",
        })}
      >
        <span>
          <strong>
            {title}
            {count > 1 ? ` (${count})` : ""}
          </strong>
          {description && <span>{description}</span>}
        </span>
        <ChevronDown aria-hidden="true" />
      </summary>
      {children}
    </details>
  );
}
