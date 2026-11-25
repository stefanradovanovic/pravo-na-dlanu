import { articleHeadings } from "./document-navigation";
import type { InstitutionSource } from "./institution-map";
import { getLawDocument } from "./registry";
import { lawPath } from "./registry-types";

type Court = {
  name: string;
  area: string;
  seat: string;
};

export type CourtGroup = {
  title: string;
  responsibility: string;
  courts: Court[];
  departments?: Court[];
  sources: InstitutionSource[];
};

export type CourtDirectoryData = {
  groups: CourtGroup[];
  sourceDate: string;
  transition?: InstitutionSource;
  territorialScope: InstitutionSource[];
};

const networkLawId = "f2d47680-3867-4d88-b830-fbbf70ab8a7f";
const organizationLawId = "383452d3-7466-483f-ab55-b4e39eda2b9c";
const newCourtStart = "2027-03-01";

const seatNames: Record<string, string> = {
  Алексинцу: "Алексинац",
  Аранђеловцу: "Аранђеловац",
  "Бачкој Паланци": "Бачка Паланка",
  Београду: "Београд",
  Бечеју: "Бечеј",
  Бору: "Бор",
  Брусу: "Брус",
  Бујановцу: "Бујановац",
  Ваљеву: "Ваљево",
  "Великом Градишту": "Велико Градиште",
  "Великој Плани": "Велика Плана",
  Врању: "Врање",
  Врбасу: "Врбас",
  Вршцу: "Вршац",
  "Горњем Милановцу": "Горњи Милановац",
  Деспотовцу: "Деспотовац",
  Димитровграду: "Димитровград",
  Зајечару: "Зајечар",
  Зрењанину: "Зрењанин",
  Ивањици: "Ивањица",
  Јагодини: "Јагодина",
  Кикинди: "Кикинда",
  Књажевцу: "Књажевац",
  Крагујевцу: "Крагујевац",
  Краљеву: "Краљево",
  Крушевцу: "Крушевац",
  Куршумлији: "Куршумлија",
  Лазаревцу: "Лазаревац",
  Лебану: "Лебане",
  Лесковцу: "Лесковац",
  Лозници: "Лозница",
  Мајданпеку: "Мајданпек",
  Мионици: "Мионица",
  Младеновцу: "Младеновац",
  Неготину: "Неготин",
  Нишу: "Ниш",
  "Новом Пазару": "Нови Пазар",
  "Новом Саду": "Нови Сад",
  Обреновцу: "Обреновац",
  Панчеву: "Панчево",
  Параћину: "Параћин",
  "Петровцу на Млави": "Петровац на Млави",
  Пироту: "Пирот",
  Пожаревцу: "Пожаревац",
  Пожеги: "Пожега",
  Прешеву: "Прешево",
  Прибоју: "Прибој",
  Пријепољу: "Пријепоље",
  Прокупљу: "Прокупље",
  Рашки: "Рашка",
  Рашкој: "Рашка",
  Руми: "Рума",
  Сенти: "Сента",
  Сјеници: "Сјеница",
  Смедереву: "Смедерево",
  Сомбору: "Сомбор",
  "Сремској Митровици": "Сремска Митровица",
  "Старој Пазови": "Стара Пазова",
  Суботици: "Суботица",
  Сурдулици: "Сурдулица",
  Трстенику: "Трстеник",
  Убу: "Уб",
  Ужицу: "Ужице",
  Чачку: "Чачак",
  Шапцу: "Шабац",
  Шиду: "Шид",
};

function readRoster(lines: string[], start: number, end: number) {
  return lines.slice(start, end).flatMap((line) => {
    const entry =
      /^\d+[а-я]?\) (.+?),? за ((?:територију|подручј[ае]) .+?)[.,]$/u.exec(
        line.trim(),
      );
    if (!entry) return [];
    const [, name, area] = entry;
    const seat = seatNames[name.split(" у ").at(-1) ?? ""];
    if (!seat) throw new Error(`Missing court seat: ${name}`);
    return [
      {
        name,
        area: area.replace(/^(територију|подручј[ае])/u, (word) =>
          word === "територију" ? "Територија" : "Подручје",
        ),
        seat,
      },
    ];
  });
}

export function getCourtDirectory(asOf?: string): CourtDirectoryData {
  const network = getLawDocument(networkLawId);
  const organization = getLawDocument(organizationLawId);
  if (!network || !organization)
    throw new Error("Court directory laws are missing");

  const sourceDate = network.record.fetchedAt.slice(0, 10);
  const beforeNewCourt = (asOf ?? sourceDate) < newCourtStart;
  const lines = network.markdown.split("\n");
  const headings = articleHeadings(network.markdown);
  const roster = (article: number) => {
    const index = headings.findIndex(({ id }) => id === `clan-${article}`);
    if (index < 0)
      throw new Error(`Court roster article ${article} is missing`);
    return readRoster(
      lines,
      headings[index].line,
      headings[index + 1].line - 1,
    );
  };
  const source = (
    record: typeof network.record,
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
    },
  ];
  const group = (
    title: string,
    responsibility: string,
    jurisdictionArticle: number,
    courts: Court[],
    networkArticle?: number,
    departments?: Court[],
  ): CourtGroup => ({
    title,
    responsibility,
    courts,
    departments,
    sources: [
      source(organization.record, jurisdictionArticle),
      ...(networkArticle ? [source(network.record, networkArticle)] : []),
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

  return {
    sourceDate,
    ...(beforeNewCourt && {
      transition: source(
        network.record,
        8,
        "-2",
        "Измене из 2026. године, члан 8.",
      ),
    }),
    territorialScope: [
      source(network.record, 12, "", "Члан 12."),
      source(network.record, 17, "", "Члан 17."),
    ],
    groups: [
      group(
        "Основни судови",
        "У првом степену решавају грађанске спорове и суде за кривична дела за која је прописана новчана казна или затвор до десет година, осим кад је надлежан други суд. Воде и ванпарничне и извршне поступке у складу са законом.",
        24,
        beforeNewCourt
          ? basicCourts.filter(
              ({ name }) => name !== "Четврти основни суд у Београду",
            )
          : basicCourts,
        3,
      ),
      group(
        "Виши судови",
        "Суде у првом степену за тежа и друга законом одређена кривична дела, у поступцима према малолетницима и у појединим грађанским споровима. Одлучују и о одређеним жалбама на одлуке основних судова.",
        25,
        higherCourts,
        4,
      ),
      group(
        "Апелациони судови",
        "Одлучују о жалбама на одлуке виших судова и о жалбама на одлуке основних судова у кривичним и грађанским предметима за које је надлежан апелациони суд.",
        26,
        roster(6),
        6,
      ),
      group(
        "Врховни суд",
        "Највиши суд у Србији. Одлучује о ванредним правним средствима, у законом предвиђеним случајевима решава сукобе надлежности и стара се о јединственој судској примени права.",
        32,
        nationalCourt("Врховни суд"),
      ),
      group(
        "Привредни судови",
        "У првом степену решавају привредне спорове, воде стечајне поступке и суде за привредне преступе, у складу са законом.",
        27,
        roster(5),
        5,
      ),
      group(
        "Привредни апелациони суд",
        "Одлучује о жалбама на одлуке привредних судова и о сукобима надлежности између њих.",
        28,
        nationalCourt("Привредни апелациони суд"),
      ),
      group(
        "Прекршајни судови",
        "У првом степену суде у прекршајним поступцима, на пример за саобраћајне прекршаје.",
        29,
        roster(2),
        2,
      ),
      group(
        "Прекршајни апелациони суд",
        "Одлучује о жалбама на одлуке прекршајних судова и на одлуке органа управе у прекршајном поступку.",
        30,
        nationalCourt("Прекршајни апелациони суд"),
        7,
        roster(7),
      ),
      group(
        "Управни суд",
        "Решава управне спорове, у којима се, између осталог, испитује законитост коначних управних аката.",
        31,
        nationalCourt("Управни суд"),
        8,
        roster(8),
      ),
    ],
  };
}
