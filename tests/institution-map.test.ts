import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { articleHeadings } from "../src/lib/document-navigation";
import { getCourtDirectory } from "../src/lib/court-directory";
import {
  filterInstitutionGroups,
  institutionGroups,
  institutionProcedures,
  ministries,
} from "../src/lib/institution-directory";
import { institutionMaps } from "../src/lib/institution-map";
import { ministryDetails } from "../src/lib/ministry-directory";
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
  assert.deepEqual(
    Object.keys(ministryDetails).sort(),
    ministries.map(({ id }) => id).sort(),
  );
  for (const { id, ministryDetails: details } of ministries) {
    assert.ok(details, id);
    const { contact, minister } = details;
    assert.ok(contact.address, id);
    assert.ok(contact.phone, id);
    assert.ok(contact.email, id);
    assert.match(contact.phone.number, /^\+381\d{8,9}$/, id);
    assert.match(contact.email.address, /^[\w.+-]+@[a-z0-9.-]+\.[a-z]+$/i, id);
    assert.match(contact.source.href, /^https:\/\//, id);
    assert.match(minister.source.href, /^https:\/\//, id);
    if (minister.portrait) {
      assert.ok(existsSync(`public${minister.portrait.src}`), id);
    }
  }
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
    filterInstitutionGroups(institutionGroups, "lokalna samouprava")[0]
      ?.profiles.length,
    4,
  );
  assert.equal(
    filterInstitutionGroups(institutionGroups, "   "),
    institutionGroups,
  );
  for (const phrase of [
    "Ђорђе Милићевић",
    "Đorđe Milićević",
    "Djordje Milicevic",
  ]) {
    assert.deepEqual(
      filterInstitutionGroups(institutionGroups, phrase).flatMap(
        ({ profiles, subsection }) =>
          [...profiles, ...(subsection?.profiles ?? [])].map(({ id }) => id),
      ),
      ["djordje-milicevic"],
    );
  }
  assert.equal(
    filterInstitutionGroups(institutionGroups, "ministar bez portfelja")[0]
      ?.subsection?.profiles.length,
    5,
  );
});

test("the court directory counts courts separately from departments and applies the 2027 changes on their start date", () => {
  const before = getCourtDirectory("2027-02-28");
  const after = getCourtDirectory("2027-03-01");
  assert.deepEqual(
    before.groups.map((group) => group.courts.length),
    [66, 25, 4, 1, 16, 1, 44, 1, 1],
  );
  assert.equal(
    before.groups.flatMap((group) => group.departments ?? []).length,
    6,
  );
  assert.ok(before.transition);
  assert.equal(after.transition, undefined);

  const court = (data: typeof before, name: string) =>
    data.groups
      .flatMap(({ courts }) => courts)
      .find((court) => court.name === name);
  assert.match(
    court(before, "Трећи основни суд у Београду")?.area ?? "",
    /Земун.*Сурчин/,
  );
  assert.equal(court(before, "Четврти основни суд у Београду"), undefined);
  assert.match(
    court(after, "Четврти основни суд у Београду")?.area ?? "",
    /Земун и Сурчин/,
  );
  assert.match(
    court(after, "Трећи основни суд у Београду")?.area ?? "",
    /Нови Београд$/,
  );
  assert.doesNotMatch(
    court(before, "Основни суд у Пожеги")?.area ?? "",
    /судском јединицом/,
  );
  assert.match(
    court(after, "Основни суд у Пожеги")?.area ?? "",
    /судском јединицом у Косјерићу/,
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
  for (const section of institutionGroups.flatMap((group) =>
    group.subsection ? [group, group.subsection] : [group],
  )) {
    if (section.source) citations.add(section.source.href);
    for (const profile of section.profiles) {
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
  const courts = getCourtDirectory("2026-11-25");
  for (const group of courts.groups) {
    for (const source of group.sources) citations.add(source.href);
  }
  if (courts.transition) citations.add(courts.transition.href);
  for (const source of courts.territorialScope) citations.add(source.href);
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
