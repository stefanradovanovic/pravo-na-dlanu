import { test } from "node:test";
import assert from "node:assert/strict";
import { getRegistry } from "../src/lib/registry";
import { lawSlug, lawPath, withLawSlugs } from "../src/lib/registry-types";

test("law addresses transliterate Serbian titles into readable ASCII", () => {
  for (const title of ["Закон о раду", "Zakon o radu"]) {
    assert.equal(lawSlug(title), "zakon-o-radu");
  }
  assert.equal(
    lawSlug("Закон о заштити потрошача"),
    "zakon-o-zastiti-potrosaca",
  );
});
test("every catalog law has a unique usable address", () => {
  const records = getRegistry().records;
  const paths = records.map(lawPath);
  assert.equal(new Set(paths).size, records.length);
  for (const path of paths)
    assert.match(path, /^\/propisi\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(paths.includes("/propisi/zakon-o-radu"));
});
test("colliding titles keep separate addresses independent of catalog order", () => {
  const records = [
    { id: "one", title: "Члан" },
    { id: "two", title: "Clan" },
  ];
  const first = withLawSlugs(records);
  assert.equal(new Set(first.map(lawPath)).size, 2);
  assert.deepEqual(withLawSlugs([...records].reverse()).reverse(), first);
});
