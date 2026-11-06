import { test } from "node:test";
import assert from "node:assert/strict";
import { searchReadingTerms } from "../src/lib/reading-guide";

test("reading glossary accepts Serbian scripts, diacritic-free input and multiple words", () => {
  for (const query of ["Члан", "Član", "clan"]) {
    assert.ok(searchReadingTerms(query).some((term) => term.id === "clan"));
  }
  for (const query of ["тачка", "tačka", "tacka"]) {
    assert.deepEqual(
      searchReadingTerms(query).map((term) => term.id),
      ["tacka"],
    );
  }
  assert.ok(
    searchReadingTerms("pristupa datum").some((term) => term.id === "datum"),
  );
  assert.ok(searchReadingTerms("sken").some((term) => term.id === "faksimil"));
  assert.equal(searchReadingTerms("непостојећи појам").length, 0);
  assert.equal(searchReadingTerms("   ").length, searchReadingTerms("").length);
});
