import publishedContacts from "../../content/prosecution-contacts.json";
import type { CourtDirectoryData } from "./court-directory";
import type { InstitutionContact } from "./institution-directory";
import type { InstitutionSource } from "./institution-map";
import { courtAreaReference, getJudicialNetwork } from "./judicial-network";

type ProsecutionOffice = {
  name: string;
  seat: string;
  area: string;
  places: string[];
  contact?: InstitutionContact;
};

type ProsecutionGroup = {
  title: string;
  offices: ProsecutionOffice[];
  sources: InstitutionSource[];
};

export type ProsecutionDirectoryData = {
  groups: ProsecutionGroup[];
  territorialScope: InstitutionSource[];
  transition?: {
    effectiveDate: string;
    source: InstitutionSource;
  };
};

const contacts: Readonly<Record<string, InstitutionContact | undefined>> =
  publishedContacts;

const officeGroups = [
  { article: 9, title: "Основна јавна тужилаштва" },
  { article: 10, title: "Виша јавна тужилаштва" },
  { article: 11, title: "Апелациона јавна тужилаштва" },
];

export function getProsecutionDirectory(
  courts: CourtDirectoryData,
): ProsecutionDirectoryData {
  const { roster, source } = getJudicialNetwork();
  const courtAreas = new Map(
    courts.groups
      .filter(({ jurisdiction }) => jurisdiction === "general")
      .flatMap(({ courts }) =>
        courts.map(
          (court) => [courtAreaReference(court.name), court.places] as const,
        ),
      ),
  );

  return {
    territorialScope: courts.territorialScope,
    transition: courts.transition && {
      effectiveDate: courts.transition.effectiveDate,
      source: courts.transition.source,
    },
    groups: officeGroups.map(({ article, title }) => ({
      title,
      sources: [source(article)],
      offices: roster(article)
        .filter(
          ({ name }) =>
            !courts.transition ||
            name !== "Четврто основно јавно тужилаштво у Београду",
        )
        .map((office) => {
          const references = office.area
            .replace(/^Подручје /u, "")
            .split(", са одељењем")[0]
            .split(" и ");
          const places = references.flatMap((reference) => {
            const places = courtAreas.get(reference);
            if (!places)
              throw new Error(`Missing prosecution district: ${reference}`);
            return places;
          });
          return {
            ...office,
            places: [...new Set(places)],
            contact: contacts[office.name],
          };
        }),
    })),
  };
}
