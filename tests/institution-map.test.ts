import assert from "node:assert/strict";
import { test } from "node:test";
import { articleHeadings } from "../src/lib/document-navigation";
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

test("each map source opens a canonical document or one of its articles", () => {
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
