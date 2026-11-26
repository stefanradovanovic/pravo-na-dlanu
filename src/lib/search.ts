const cyrillic = "абвгдђежзијклљмнњопрстћуфхцчџш";
const latin = [
  "a",
  "b",
  "v",
  "g",
  "d",
  "dj",
  "e",
  "z",
  "z",
  "i",
  "j",
  "k",
  "l",
  "lj",
  "m",
  "n",
  "nj",
  "o",
  "p",
  "r",
  "s",
  "t",
  "c",
  "u",
  "f",
  "h",
  "c",
  "c",
  "dz",
  "s",
];
export function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .replace(/[а-яђјљњћџ]/g, (c) => latin[cyrillic.indexOf(c)] ?? c)
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const lawSearchExamples = [
  {
    title: "Закон о раду",
    phrases: [
      "Рад",
      "Радни однос",
      "Радни односи",
      "Запослење",
      "Уговор о раду",
      "Годишњи одмор",
      "Зарада",
    ],
  },
  {
    title: "Закон о безбедности саобраћаја на путевима",
    phrases: [
      "Саобраћај",
      "Безбедност саобраћаја",
      "Правила саобраћаја",
      "Возачка дозвола",
    ],
  },
  {
    title: "Закон о заштити потрошача",
    phrases: [
      "Потрошач",
      "Потрошачи",
      "Заштита потрошача",
      "Права потрошача",
      "Рекламација",
    ],
  },
] as const;

export const lawSearchTopics = [
  ...lawSearchExamples,
  {
    title: "Закон о заштити података о личности",
    phrases: ["Заштита података", "Подаци о личности"],
  },
  {
    title: "Закон о општем управном поступку",
    phrases: ["Управни поступак", "Управни акт", "Право на жалбу"],
  },
  {
    title: "Породични закон",
    phrases: ["Породица", "Права детета", "Издржавање", "Родитељско право"],
  },
  {
    title: "Закон о забрани дискриминације",
    phrases: ["Дискриминација", "Забрана дискриминације"],
  },
  {
    title: "Устав Републике Србије",
    phrases: ["Устав", "Људска права"],
  },
  {
    title: "Закон о слободном приступу информацијама од јавног значаја",
    phrases: [
      "Информације од јавног значаја",
      "Приступ информацијама",
      "Слободан приступ информацијама",
    ],
  },
  {
    title: "Кривични законик",
    phrases: ["Кривично дело", "Кривична дела"],
  },
] as const;

export function findLawSearchTopic(query: string) {
  const normalized = normalizeSearch(query);
  if (normalized.length < 3) return;
  const exact = lawSearchTopics.find(({ phrases }) =>
    phrases.some((phrase) => normalizeSearch(phrase) === normalized),
  );
  if (exact) return exact;
  const matches = lawSearchTopics.filter(({ phrases }) =>
    phrases.some((phrase) => normalizeSearch(phrase).startsWith(normalized)),
  );
  if (matches.length === 1) return matches[0];
}

/** Title-only search: exact names win; broader queries retain word-prefix discovery. */
export function searchLawTitles<T extends { title: string }>(
  records: readonly T[],
  query: string,
): T[] {
  const normalized = normalizeSearch(query);
  if (!normalized) return [...records];
  const titles = records.map((record) => ({
    record,
    title: normalizeSearch(record.title),
  }));
  const exact = titles.filter(({ title }) => title === normalized);
  if (exact.length) return exact.map(({ record }) => record);

  const topic = findLawSearchTopic(normalized);
  const tokens = normalized.split(" ");
  const multiWord = tokens.length > 1;
  const shortPrefix = multiWord && tokens.at(-1)?.length === 2;
  const titleStartRank = 5;
  const matchesWord = (
    word: string,
    token: string,
    index: number,
    inPhrase = false,
  ) =>
    token.length >= 3 ||
    (index === tokens.length - 1 && (shortPrefix || (multiWord && inPhrase)))
      ? word.startsWith(token)
      : word === token;
  return titles
    .map(({ record, title }) => {
      if (record.title === topic?.title)
        return { record, rank: titleStartRank + 1, length: title.length };
      const words = title.split(" ");
      const matchesPhraseAt = (start: number) =>
        tokens.every((token, offset) =>
          matchesWord(words[start + offset] ?? "", token, offset, true),
        );
      const startsTitle = multiWord && matchesPhraseAt(0);
      const prefixPhrase =
        startsTitle || words.some((_, start) => matchesPhraseAt(start));
      if (
        !prefixPhrase &&
        !tokens.every((token, index) =>
          words.some((word) => matchesWord(word, token, index)),
        )
      )
        return { record, rank: 0, length: title.length };
      const phrase = ` ${title} `.includes(` ${normalized} `);
      const wholeWords = tokens.every((token) => words.includes(token));
      return {
        record,
        length: title.length,
        rank: startsTitle
          ? titleStartRank
          : phrase
            ? 4
            : wholeWords
              ? 3
              : prefixPhrase
                ? 2
                : 1,
      };
    })
    .filter(({ rank }) => rank > 0)
    .sort(
      (a, b) =>
        b.rank - a.rank ||
        (topic || shortPrefix || a.rank === titleStartRank
          ? a.length - b.length
          : 0),
    )
    .map(({ record }) => record);
}
