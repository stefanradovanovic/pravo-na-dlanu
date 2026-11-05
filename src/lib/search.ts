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
