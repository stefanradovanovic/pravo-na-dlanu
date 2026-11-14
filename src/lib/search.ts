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

  const tokens = normalized.split(" ");
  const multiWord = tokens.length > 1;
  const shortPrefix = multiWord && tokens.at(-1)?.length === 2;
  const titleStartRank = 5;
  const matchesWord = (word: string, token: string, index: number) =>
    token.length >= 3 || (shortPrefix && index === tokens.length - 1)
      ? word.startsWith(token)
      : word === token;
  return titles
    .map(({ record, title }) => {
      const words = title.split(" ");
      if (
        !tokens.every((token, index) =>
          words.some((word) => matchesWord(word, token, index)),
        )
      )
        return { record, rank: 0, length: title.length };
      const startsTitle = multiWord && title.startsWith(normalized);
      const phrase = ` ${title} `.includes(` ${normalized} `);
      const wholeWords = tokens.every((token) => words.includes(token));
      const prefixPhrase = words.some((_, start) =>
        tokens.every((token, offset) =>
          matchesWord(words[start + offset] ?? "", token, offset),
        ),
      );
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
        (shortPrefix || a.rank === titleStartRank ? a.length - b.length : 0),
    )
    .map(({ record }) => record);
}
