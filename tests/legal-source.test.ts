import { test } from "node:test";
import assert from "node:assert/strict";
import { convertLegalHtml, duplicateGroups } from "../scripts/legal-source";
import { normalizeSearch } from "../src/lib/search";
test("search is equivalent across Serbian scripts and unaccented typing", () => {
  for (const [a, b] of [
    ["Годишњи одмор", "godišnji odmor"],
    ["Заштита потрошача", "zastita potrosaca"],
    ["Ђорђе Љубић Његош Џеп", "Đorđe Ljubić Njegoš Džep"],
  ])
    assert.equal(normalizeSearch(a), normalizeSearch(b));
});
test("a full law remains one document including last article, table and footnote", () => {
  const result = convertLegalHtml(
    '<html><head><script>bad()</script></head><body><h1>Закон о провери</h1><p>Члан 1.</p><p>Овим законом уређује се право свих грађана на приступ прописима.</p><table><tr><td rowspan="2">Право</td><td>Обавеза</td></tr><tr><td>Услови</td></tr></table><table></table><p>Члан 206.</p><p>Последња одредба остаје у истом документу.</p><p><a href="/notes">Напомена извора</a></p></body></html>',
    "https://reg.pravno-informacioni-sistem.rs/api/viewAct/example",
  );
  assert.match(result.markdown, /## Члан 1\./);
  assert.match(result.markdown, /## Члан 206\./);
  assert.match(result.markdown, /rowspan="2"/);
  assert.match(result.markdown, /Последња одредба/);
  assert.match(
    result.markdown,
    /https:\/\/reg\.pravno-informacioni-sistem\.rs\/notes/,
  );
  assert.doesNotMatch(result.markdown, /bad\(\)/);
});
test("access errors cannot become legal documents", () => {
  for (const html of [
    "Dokument ne moze biti prikazan.",
    "Access Denied".repeat(20),
    "<p>Morate biti ulogovani</p>".repeat(20),
  ])
    assert.throws(
      () => convertLegalHtml(html, "https://example.com"),
      /Missing or blocked/,
    );
});
test("deduplication identifies exact identities without merging similarly named acts", () => {
  const groups = duplicateGroups(
    [
      { id: "a", title: "Закон" },
      { id: "a", title: "Закон" },
      { id: "b", title: "Закон" },
    ],
    (r) => r.id,
  );
  assert.equal(groups.length, 1);
  assert.equal(groups[0].length, 2);
  assert.ok(groups[0].every((r) => r.id === "a"));
});
