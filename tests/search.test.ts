import { test } from "node:test";
import assert from "node:assert/strict";
import { searchLawTitles } from "../src/lib/search";
import { getRegistry } from "../src/lib/registry";

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
  assert.deepEqual(searchLawTitles(records, "rad"), records.slice(0, 3));
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
