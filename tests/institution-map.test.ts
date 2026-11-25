import assert from "node:assert/strict";
import { test } from "node:test";
import { articleHeadings } from "../src/lib/document-navigation";
import {
  filterInstitutionGroups,
  institutionGroups,
  institutionProcedures,
  ministries,
} from "../src/lib/institution-directory";
import { institutionMaps } from "../src/lib/institution-map";
import { getLawDocument, getRegistry } from "../src/lib/registry";
import { lawPath } from "../src/lib/registry-types";

test("each institution relationship connects named nodes on the same map", () => {
  const mapIds = new Set(institutionMaps.map((map) => map.id));
  assert.equal(mapIds.size, institutionMaps.length);
  for (const map of institutionMaps) {
    const nodeIds = new Set(map.nodes.map((node) => node.id));
    assert.equal(nodeIds.size, map.nodes.length, map.title);
    for (const node of map.nodes) {
      if (node.relatedMap) assert.ok(mapIds.has(node.relatedMap.id), node.name);
      assert.ok(
        map.edges.some((edge) => edge.from === node.id || edge.to === node.id),
        node.name,
      );
    }
    for (const edge of map.edges) {
      assert.ok(nodeIds.has(edge.from), edge.from);
      assert.ok(nodeIds.has(edge.to), edge.to);
      assert.notEqual(edge.from, edge.to, edge.label);
    }
  }
});

test("the directory covers exactly the ministries listed in the corpus", () => {
  const registry = getRegistry();
  const record = registry.records.find(
    (entry) => entry.title === "Закон о министарствима",
  );
  assert.ok(record);
  const law = getLawDocument(record.id);
  assert.ok(law);
  const roster = law.markdown.split("## Члан 2.")[1].split("## Члан 3.")[0];
  const names = [...roster.matchAll(/^\d+\) (Министарство [^.;]+)[.;]$/gm)].map(
    (match) => match[1],
  );
  assert.ok(names.length);
  assert.deepEqual(
    ministries.map((ministry) => ministry.name).sort(),
    names.sort(),
  );
});

test("the directory finds institutions across Serbian scripts and diacritics", () => {
  for (const phrase of [
    "заштитник грађана",
    "Zaštitnik građana",
    "zastitnik gradana",
    "zastitnik gradjana",
  ]) {
    assert.deepEqual(
      filterInstitutionGroups(institutionGroups, phrase).flatMap(
        ({ profiles }) => profiles.map(({ id }) => id),
      ),
      ["zastitnik-gradjana"],
    );
  }
  assert.deepEqual(filterInstitutionGroups(institutionGroups, "zzzx"), []);
  assert.equal(
    filterInstitutionGroups(institutionGroups, "   "),
    institutionGroups,
  );
});

test("each map and directory source opens a canonical document or one of its articles", () => {
  const records = new Map(
    getRegistry().records.map((record) => [lawPath(record), record]),
  );
  const citations = new Set<string>();
  for (const map of institutionMaps) {
    const items = [...map.nodes, ...map.edges, ...(map.procedure?.steps ?? [])];
    if (map.procedure?.note) items.push(map.procedure.note);
    for (const item of items) {
      assert.ok(item.sources.length, map.title);
      for (const source of item.sources) citations.add(source.href);
    }
  }
  const mapIds = new Set(institutionMaps.map((map) => map.id));
  const profileIds = new Set<string>();
  for (const group of institutionGroups) {
    if (group.source) citations.add(group.source.href);
    for (const profile of group.profiles) {
      assert.ok(!profileIds.has(profile.id), profile.name);
      profileIds.add(profile.id);
      if (profile.mapId) assert.ok(mapIds.has(profile.mapId), profile.name);
      assert.ok(profile.sources.length, profile.name);
      for (const source of profile.sources) citations.add(source.href);
    }
  }
  for (const procedure of institutionProcedures) {
    for (const source of procedure.sources) citations.add(source.href);
  }
  const anchors = new Map<string, Set<string>>();
  for (const citation of citations) {
    const [pathname, fragment] = citation.split("#");
    const record = records.get(pathname);
    assert.ok(record, citation);
    if (!fragment) continue;
    if (!anchors.has(pathname)) {
      const law = getLawDocument(record.id);
      assert.ok(law, citation);
      anchors.set(
        pathname,
        new Set(articleHeadings(law.markdown).map((article) => article.id)),
      );
    }
    assert.ok(anchors.get(pathname)?.has(fragment), citation);
  }
});
