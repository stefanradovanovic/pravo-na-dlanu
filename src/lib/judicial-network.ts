import { articleHeadings } from "./document-navigation";
import { getLawDocument } from "./registry";
import { lawPath } from "./registry-types";

type NetworkEntry = { name: string; seat: string; area: string };

const networkLawId = "f2d47680-3867-4d88-b830-fbbf70ab8a7f";

const courtGenitives: Record<string, string> = {
  Први: "Првог",
  Други: "Другог",
  Трећи: "Трећег",
  Четврти: "Четвртог",
  Основни: "Основног",
  Виши: "Вишег",
  Апелациони: "Апелационог",
};

export function courtAreaReference(name: string) {
  return name.replace(
    /^(\S+) (основни )?суд у /u,
    (_, first: string, ordinal?: string) =>
      `${courtGenitives[first]} ${ordinal ? "основног " : ""}суда у `,
  );
}

export const seatNames: Record<string, string> = {
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
  "Владичином Хану": "Владичин Хан",
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

function readRoster(
  lines: string[],
  start: number,
  end: number,
): NetworkEntry[] {
  return lines.slice(start, end).flatMap((line) => {
    const entry =
      /^\d+[а-я]?\) (.+?),? за ((?:територију|подручј[ае]) .+?)[.,]$/u.exec(
        line.trim(),
      );
    if (!entry) return [];
    const [, name, area] = entry;
    const seat = seatNames[name.split(" у ").at(-1) ?? ""];
    if (!seat) throw new Error(`Missing institution seat: ${name}`);
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

export function getJudicialNetwork() {
  const law = getLawDocument(networkLawId);
  if (!law) throw new Error("Court network law is missing");

  const { record, markdown } = law;
  const lines = markdown.split("\n");
  const headings = articleHeadings(markdown);

  return {
    record,
    roster(article: number) {
      const index = headings.findIndex(({ id }) => id === `clan-${article}`);
      if (index < 0)
        throw new Error(`Judicial network article ${article} is missing`);
      return readRoster(
        lines,
        headings[index].line,
        headings[index + 1].line - 1,
      );
    },
    source(article: number) {
      return {
        title: `${record.title}, члан ${article}.`,
        href: `${lawPath(record)}#clan-${article}`,
      };
    },
  };
}
