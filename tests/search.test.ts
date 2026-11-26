import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findLawSearchTopic,
  lawSearchTopics,
  normalizeSearch,
  searchLawTitles,
} from "../src/lib/search";
import { getLawDocument, getRegistry } from "../src/lib/registry";
import { documentPassages } from "../scripts/document-passages";

test("extending a title prefix keeps the labor law first", () => {
  const records = getRegistry().records;
  for (const query of [
    "zakon o ra",
    "zakon o rad",
    "закон о ра",
    "закон о рад",
  ]) {
    assert.equal(searchLawTitles(records, query)[0]?.title, "Закон о раду");
  }
});

test("abbreviated title words remain visible while typing the next word", () => {
  const records = getRegistry().records;
  const title = "Закон о безбедности саобраћаја на путевима";
  for (const query of [
    "zakon o bezb",
    "zakon o bezb s",
    "zakon o bezb sa",
    "zak o bezb sao",
    "закон о безб сао",
  ]) {
    assert.ok(
      searchLawTitles(records, query)
        .slice(0, 6)
        .some((record) => record.title === title),
      query,
    );
  }
  assert.equal(
    searchLawTitles(records, "zak o bezb saobracaja")[0]?.title,
    title,
  );
});

test("short topics lead with their main law in either Serbian script", () => {
  const records = getRegistry().records;
  for (const query of ["Rad", "Рад", " RAD "]) {
    assert.equal(searchLawTitles(records, query)[0]?.title, "Закон о раду");
  }
  assert.equal(
    searchLawTitles(records, "saobracaj")[0]?.title,
    "Закон о безбедности саобраћаја на путевима",
  );
  assert.equal(
    searchLawTitles(records, "Potrošač")[0]?.title,
    "Закон о заштити потрошача",
  );
});

test("unambiguous topic prefixes lead with their law while the user is typing", () => {
  const records = getRegistry().records;
  for (const query of ["sao", "saobra...", "саобра", "saobrać"])
    assert.equal(
      searchLawTitles(records, query)[0]?.title,
      "Закон о безбедности саобраћаја на путевима",
    );
  assert.equal(findLawSearchTopic("zastita po"), undefined);
});

test("every topic phrase ranks its law first and appears in that law", () => {
  const records = getRegistry().records;
  const seen = new Set<string>();
  for (const { title, phrases } of lawSearchTopics) {
    const record = records.find((item) => item.title === title);
    assert.ok(record, title);
    const passages = documentPassages(getLawDocument(record.id)!.markdown).map(
      ({ text }) => ` ${normalizeSearch(text)} `,
    );
    for (const phrase of phrases) {
      const normalized = normalizeSearch(phrase);
      assert.ok(!seen.has(normalized), phrase);
      seen.add(normalized);
      assert.equal(searchLawTitles(records, phrase)[0]?.title, title, phrase);
      assert.ok(
        passages.some((passage) => passage.includes(` ${normalized} `)),
        phrase,
      );
    }
  }
});

test("an exact law title excludes unrelated laws in the same classification", () => {
  for (const query of ["zakon o radu", "Закон о раду", "  ZAKON O RADU!  "]) {
    assert.deepEqual(
      searchLawTitles(getRegistry().records, query).map((r) => r.title),
      ["Закон о раду"],
    );
  }
});

test("title search ignores classification and citation matches", () => {
  const records = [
    { title: "Закон о савету", groups: ["Заштита на раду"], citation: "Рад" },
    { title: "Закон о раду", groups: [], citation: "" },
  ];
  assert.deepEqual(searchLawTitles(records, "rad"), [records[1]]);
});

test("title phrases and whole words outrank partial words", () => {
  const records = [
    { title: "Закон о радницима" },
    { title: "Закон о безбедности на раду" },
    { title: "Закон о раду" },
    { title: "Закон о граду" },
  ];
  assert.deepEqual(searchLawTitles(records, "o rad"), [
    records[0],
    records[2],
    records[1],
  ]);
  assert.deepEqual(searchLawTitles(records, "o radu"), [
    records[2],
    records[1],
  ]);
  assert.deepEqual(searchLawTitles(records, "radu"), [records[1], records[2]]);
  assert.deepEqual(searchLawTitles(records, "rad"), [
    records[2],
    records[0],
    records[1],
  ]);
  assert.deepEqual(searchLawTitles(records, "nepostojeci"), []);
  assert.deepEqual(searchLawTitles(records, ""), records);
});

test("Serbian scripts and omitted diacritics return the same law", () => {
  const records = getRegistry().records;
  for (const query of [
    "Закон о заштити потрошача",
    "Zakon o zaštiti potrošača",
    "zakon o zastiti potrosaca",
  ]) {
    assert.deepEqual(
      searchLawTitles(records, query).map((r) => r.title),
      ["Закон о заштити потрошача"],
    );
  }
  assert.ok(searchLawTitles(records, "potrosac").length > 0);
});
