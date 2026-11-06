import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "cheerio";
import { inlineJson, escapeHtml } from "../src/reader/serialization";

test("reader props cannot escape their JSON script, and round-trip Serbian text", () => {
  const value = {
    label: 'Члан 12а. </script><script>alert("x")</script>\u2028\u2029 & <',
  };
  const html = `<script id="props" type="application/json">${inlineJson(value)}</script>`;
  const $ = load(html);
  assert.equal($("script").length, 1);
  assert.deepEqual(JSON.parse($("#props").text()), value);
});

test("law metadata is escaped as text and attribute content", () => {
  const value = "Закон <текст> & \"навод\" 'текст'";
  const $ = load(
    `<title>${escapeHtml(value)}</title><a href="${escapeHtml(value)}">извор</a>`,
  );
  assert.equal($("title").text(), value);
  assert.equal($("a").attr("href"), value);
});
