import { courtContacts, courtDepartmentContacts } from "./court-contacts";
import type { InstitutionContact } from "./institution-directory";
import type { InstitutionSource } from "./institution-map";
import {
  courtAreaReference,
  getJudicialNetwork,
  seatNames,
} from "./judicial-network";
import { getLawDocument } from "./registry";
import { lawPath } from "./registry-types";

type Court = {
  name: string;
  area: string;
  seat: string;
  places: string[] | null;
  contact?: InstitutionContact;
};

export type CourtGroup = {
  jurisdiction: "supreme" | "general" | "special";
  title: string;
  responsibility: string;
  courts: Court[];
  departments?: Court[];
  sources: InstitutionSource[];
};

export type CourtChange = {
  court: string;
  places: string[];
  description: string;
};

export type CourtDirectoryData = {
  groups: CourtGroup[];
  sourceDate: string;
  transition?: {
    effectiveDate: string;
    source: InstitutionSource;
    changes: CourtChange[];
  };
  territorialScope: InstitutionSource[];
};

const organizationLawId = "383452d3-7466-483f-ab55-b4e39eda2b9c";
const newCourtStart = "2027-03-01";

const splitNames = (names: string) => names.split(/, | и /u);

const cityNames = {
  Београда: "Београд",
  Чачка: "Чачак",
  "Сремске Митровице": "Сремска Митровица",
} as Record<string, string>;

function addDirectCoverage(
  courts: Omit<Court, "places">[],
  belgradeBoroughs: string[] = [],
) {
  return courts.map((court) => {
    const territory = court.area.split(", са ")[0];
    const places = splitNames(
      territory
        .replace(
          /^Територија (?:градских општина|градске општине|општина|општине|града) /u,
          "",
        )
        .replace(/ и за град(?:ове)? /gu, ", "),
    ).map((name) => cityNames[name] ?? name);
    if (territory.startsWith("Територија градск")) places.push("Београд");
    if (territory === "Територија града Београда")
      places.push(...belgradeBoroughs);
    return { ...court, places };
  });
}

function inheritCoverage(
  courts: Omit<Court, "places">[],
  lowerCourts: Map<string, Court>,
  references: (area: string) => string[],
) {
  return courts.map((court) => {
    const places = references(court.area).flatMap((reference) => {
      const lowerCourt = lowerCourts.get(reference);
      if (!lowerCourt?.places) {
        throw new Error(
          `Missing territorial reference: ${reference} (${court.name})`,
        );
      }
      return lowerCourt.places;
    });
    return { ...court, places: [...new Set(places)] };
  });
}

function basicCourtReferences(area: string) {
  const names = area
    .replace(/^Подручје /u, "")
    .replace(/^(.+?) основног суда у Београду(?=,)/u, (_, ordinals: string) =>
      splitNames(ordinals)
        .map((ordinal) => `${ordinal} основног суда у Београду`)
        .join(", "),
    );
  return splitNames(names).map((name) =>
    name.replace(/^Oсновног/u, "Основног"),
  );
}

function courtSeatReferences(area: string) {
  return splitNames(area.split(" судова у ")[1]).map((seat) => seatNames[seat]);
}

const bySeat = (courts: Court[]) =>
  new Map(courts.map((court) => [court.seat, court]));

const courtNetworkDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Belgrade",
  dateStyle: "short",
});

export function getCourtDirectory(
  asOf = courtNetworkDate.format(),
): CourtDirectoryData {
  const { record: network, roster } = getJudicialNetwork();
  const organization = getLawDocument(organizationLawId);
  if (!organization) throw new Error("Court organization law is missing");

  const sourceDate = network.fetchedAt.slice(0, 10);
  const beforeNewCourt = asOf < newCourtStart;
  const source = (
    record: typeof network,
    article: number,
    occurrence = "",
    title = `${record.title}, члан ${article}.`,
  ): InstitutionSource => ({
    title,
    href: `${lawPath(record)}#clan-${article}${occurrence}`,
  });
  const nationalCourt = (name: string) => [
    {
      name,
      seat: "Београд",
      area: "Република Србија · седиште у Београду",
      places: null,
    },
  ];
  const group = (
    jurisdiction: CourtGroup["jurisdiction"],
    title: string,
    responsibility: string,
    jurisdictionArticle: number,
    courts: Court[],
    networkArticle?: number,
    departments?: Court[],
  ): CourtGroup => ({
    jurisdiction,
    title,
    responsibility,
    courts: courts.map((court) => ({
      ...court,
      contact: courtContacts[court.name],
    })),
    departments: departments?.map((department) => ({
      ...department,
      contact: courtDepartmentContacts[title]?.[department.name],
    })),
    sources: [
      source(organization.record, jurisdictionArticle),
      ...(networkArticle ? [source(network, networkArticle)] : []),
      ...(courts.length === 1
        ? [source(organization.record, jurisdictionArticle === 32 ? 15 : 16)]
        : []),
    ],
  });

  const basicCourts = roster(3);
  const higherCourts = roster(4);
  if (beforeNewCourt) {
    const third = basicCourts.find(
      ({ name }) => name === "Трећи основни суд у Београду",
    );
    const pozega = basicCourts.find(
      ({ name }) => name === "Основни суд у Пожеги",
    );
    const belgrade = higherCourts.find(
      ({ name }) => name === "Виши суд у Београду",
    );
    if (third)
      third.area = "Територија градских општина Земун, Нови Београд и Сурчин";
    if (pozega)
      pozega.area = pozega.area.replace(
        ", са судском јединицом у Косјерићу",
        "",
      );
    if (belgrade)
      belgrade.area = belgrade.area.replace(
        "Првог, Другог, Трећег и Четвртог",
        "Првог, Другог и Трећег",
      );
  }

  const activeBasicCourts = addDirectCoverage(
    beforeNewCourt
      ? basicCourts.filter(
          ({ name }) => name !== "Четврти основни суд у Београду",
        )
      : basicCourts,
  );
  const belgradeBoroughs = activeBasicCourts
    .filter(({ area }) => area.startsWith("Територија градск"))
    .flatMap(({ places }) => places.filter((place) => place !== "Београд"));
  const basicByGenitive = new Map(
    activeBasicCourts.map((court) => [courtAreaReference(court.name), court]),
  );
  const higherWithCoverage = inheritCoverage(
    higherCourts,
    basicByGenitive,
    basicCourtReferences,
  );
  const higherBySeat = bySeat(higherWithCoverage);
  const misdemeanorCourts = addDirectCoverage(roster(2));

  return {
    sourceDate,
    ...(beforeNewCourt && {
      transition: {
        effectiveDate: newCourtStart,
        source: source(network, 8, "-2", "Измене из 2026. године, члан 8."),
        changes: [
          {
            court: "Трећи основни суд у Београду",
            places: ["Земун", "Сурчин", "Нови Београд", "Београд"],
            description:
              "Четврти основни суд у Београду преузима Земун и Сурчин. Трећи основни суд у Београду остаје надлежан за Нови Београд.",
          },
          {
            court: "Основни суд у Пожеги",
            places: ["Косјерић"],
            description:
              "Основни суд у Пожеги добија судску јединицу у Косјерићу.",
          },
        ],
      },
    }),
    territorialScope: [
      source(network, 12, "", "Члан 12."),
      source(network, 17, "", "Члан 17."),
    ],
    groups: [
      group(
        "supreme",
        "Врховни суд",
        "Највиши суд у Србији. Одлучује о ванредним правним средствима, у законом предвиђеним случајевима решава сукобе надлежности и стара се о јединственој судској примени права.",
        32,
        nationalCourt("Врховни суд"),
      ),
      group(
        "general",
        "Апелациони судови",
        "Одлучују о жалбама на одлуке виших судова и о жалбама на одлуке основних судова у кривичним и грађанским предметима за које је надлежан апелациони суд.",
        26,
        inheritCoverage(roster(6), higherBySeat, courtSeatReferences),
        6,
      ),
      group(
        "general",
        "Виши судови",
        "Суде у првом степену за тежа и друга законом одређена кривична дела, у поступцима према малолетницима и у појединим грађанским споровима. Одлучују и о одређеним жалбама на одлуке основних судова.",
        25,
        higherWithCoverage,
        4,
      ),
      group(
        "general",
        "Основни судови",
        "У првом степену решавају грађанске спорове и суде за кривична дела за која је прописана новчана казна или затвор до десет година, осим кад је надлежан други суд. Воде и ванпарничне и извршне поступке у складу са законом.",
        24,
        activeBasicCourts,
        3,
      ),
      group(
        "special",
        "Привредни апелациони суд",
        "Одлучује о жалбама на одлуке привредних судова и о сукобима надлежности између њих.",
        28,
        nationalCourt("Привредни апелациони суд"),
      ),
      group(
        "special",
        "Привредни судови",
        "У првом степену решавају привредне спорове, воде стечајне поступке и суде за привредне преступе, у складу са законом.",
        27,
        addDirectCoverage(roster(5), belgradeBoroughs),
        5,
      ),
      group(
        "special",
        "Прекршајни апелациони суд",
        "Одлучује о жалбама на одлуке прекршајних судова и на одлуке органа управе у прекршајном поступку.",
        30,
        nationalCourt("Прекршајни апелациони суд"),
        7,
        inheritCoverage(
          roster(7),
          bySeat(misdemeanorCourts),
          courtSeatReferences,
        ),
      ),
      group(
        "special",
        "Прекршајни судови",
        "У првом степену суде у прекршајним поступцима, на пример за саобраћајне прекршаје.",
        29,
        misdemeanorCourts,
        2,
      ),
      group(
        "special",
        "Управни суд",
        "Решава управне спорове, у којима се, између осталог, испитује законитост коначних управних аката.",
        31,
        nationalCourt("Управни суд"),
        8,
        inheritCoverage(roster(8), higherBySeat, courtSeatReferences),
      ),
    ],
  };
}
