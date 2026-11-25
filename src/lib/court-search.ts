import type { CourtGroup } from "./court-directory";
import type { ProsecutionDirectoryData } from "./prosecution-directory";
import { normalizeSearch } from "./search";

export const normalizeCourtSearch = (value: string) =>
  normalizeSearch(value).replaceAll("dj", "d");

type TerritorialEntry = Pick<
  CourtGroup["courts"][number],
  "name" | "area" | "seat" | "places"
>;
function matchTerritorialEntries(entries: TerritorialEntry[], query: string) {
  const place = entries
    .flatMap(({ places }) => places ?? [])
    .find((place) => normalizeCourtSearch(place) === query);
  const terms = query.split(" ");
  return {
    place,
    matches(
      { name, area, seat, places }: TerritorialEntry,
      groupTitle: string,
    ) {
      if (place) return places === null || places.includes(place);
      const text = normalizeCourtSearch(
        [name, seat, area, groupTitle, ...(places ?? [])].join(" "),
      );
      return terms.every((term) => text.includes(term));
    },
  };
}

export function searchCourtGroups(groups: CourtGroup[], query: string) {
  if (!query) return { groups, place: undefined };

  const { place, matches } = matchTerritorialEntries(
    groups.flatMap(({ courts }) => courts),
    query,
  );
  const results = groups
    .map((group) => ({
      ...group,
      courts: group.courts.filter((court) => matches(court, group.title)),
      departments: group.departments?.filter((department) =>
        matches(department, group.title),
      ),
    }))
    .filter(({ courts, departments }) => courts.length || departments?.length);

  return { groups: results, place };
}

export function searchProsecutionGroups(
  groups: ProsecutionDirectoryData["groups"],
  query: string,
) {
  if (!query) return { groups, place: undefined };

  const { place, matches } = matchTerritorialEntries(
    groups.flatMap(({ offices }) => offices),
    query,
  );
  return {
    place,
    groups: groups
      .map((group) => ({
        ...group,
        offices: group.offices.filter((office) => matches(office, group.title)),
      }))
      .filter(({ offices }) => offices.length > 0),
  };
}
