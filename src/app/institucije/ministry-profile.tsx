import type { ReactNode } from "react";
import type { MinistryDetails } from "@/lib/ministry-directory";
import { InstitutionSources } from "./institution-sources";

const sourceDate = new Intl.DateTimeFormat("sr-Cyrl-RS", {
  dateStyle: "short",
  timeZone: "UTC",
});

export function SourceAccessDate({ accessedAt }: { accessedAt: string }) {
  return (
    <>
      Приступљено{" "}
      <time dateTime={accessedAt}>
        {sourceDate.format(new Date(accessedAt))}
      </time>
    </>
  );
}

export function MinistryOverview({
  minister,
  heading,
  children,
}: {
  minister: MinistryDetails["minister"];
  heading: ReactNode;
  children: ReactNode;
}) {
  return (
    <header className="ministry-overview">
      {heading}
      <div className="ministry-leader">
        {minister.portrait && (
          // eslint-disable-next-line @next/next/no-img-element -- Serve the local portraits as published under their respective licenses.
          <img
            src={minister.portrait.src}
            alt=""
            width={minister.portrait.width}
            height={minister.portrait.height}
            loading="lazy"
            decoding="async"
          />
        )}
        {minister.name === undefined ? (
          <>
            <strong>{minister.title}</strong>
            <p>{minister.description}</p>
          </>
        ) : (
          <>
            <strong>{minister.name}</strong>
            <p>{minister.title}</p>
            <a
              className="text-link"
              href={minister.biography}
              aria-label={`Званична биографија — ${minister.name}`}
            >
              Званична биографија
            </a>
          </>
        )}
      </div>
      {children}
    </header>
  );
}

export function MinistryContacts({
  details: { contact, website, service, office },
}: {
  details: MinistryDetails;
}) {
  const { address, phone, email, source } = contact;
  return (
    <div className="ministry-contacts">
      <div>
        <h4>Контакт</h4>
        {address || phone || email ? (
          <dl>
            {address && (
              <div>
                <dt>{office ? "Адреса кабинета" : "Адреса министарства"}</dt>
                <dd>{address}</dd>
              </div>
            )}
            {phone && (
              <div>
                <dt>{phone.label}</dt>
                <dd>
                  <a className="text-link" href={`tel:${phone.number}`}>
                    {phone.display}
                  </a>
                </dd>
              </div>
            )}
            {email && (
              <div>
                <dt>{email.label}</dt>
                <dd>
                  <a className="text-link" href={`mailto:${email.address}`}>
                    {email.address}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p>Именик Владе наводи кабинет без контакт података.</p>
        )}
        <a className="text-link" href={source.href}>
          {source.title}
        </a>
      </div>
      {(website || service) && (
        <div>
          <h4>{service ? "Сајт и услуге" : "Сајт"}</h4>
          <ul>
            {website && (
              <li>
                <a className="text-link" href={website}>
                  {office
                    ? "Званични сајт кабинета"
                    : "Званични сајт министарства"}
                </a>
              </li>
            )}
            {service && (
              <li>
                <a className="text-link" href={service.href}>
                  {service.title}
                </a>
                {service.description && <p>{service.description}</p>}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function MinistrySources({
  details: { contact, minister },
}: {
  details: MinistryDetails;
}) {
  const { portrait, source, additionalSource, accessedAt } = minister;
  return (
    <div className="ministry-source-details">
      {accessedAt === contact.accessedAt ? (
        <p>
          Функција и контакти · <SourceAccessDate accessedAt={accessedAt} />
        </p>
      ) : (
        <>
          <p>
            Функција · <SourceAccessDate accessedAt={accessedAt} />
          </p>
          <p>
            Контакти · <SourceAccessDate accessedAt={contact.accessedAt} />
          </p>
        </>
      )}
      <details>
        <summary>
          {portrait ? "Извор о функцији и фотографија" : "Извор о функцији"}
        </summary>
        <InstitutionSources
          sources={additionalSource ? [source, additionalSource] : [source]}
        />
        {portrait && (
          <p>
            <a className="text-link" href={portrait.source}>
              Фотографија
            </a>
            {` · ${portrait.credit} · `}
            <a className="text-link" href={portrait.license.href}>
              {portrait.license.title}
            </a>
            {portrait.changes && ` · ${portrait.changes}`}
          </p>
        )}
      </details>
    </div>
  );
}
