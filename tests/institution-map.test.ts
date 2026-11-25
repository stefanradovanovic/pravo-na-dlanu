import assert from "node:assert/strict";
import { test } from "node:test";
import { articleHeadings } from "../src/lib/document-navigation";
import { getCourtDirectory } from "../src/lib/court-directory";
import { getProsecutionDirectory } from "../src/lib/prosecution-directory";
import {
  courtContacts,
  courtDepartmentContacts,
} from "../src/lib/court-contacts";
import {
  normalizeCourtSearch,
  searchCourtGroups,
  searchProsecutionGroups,
} from "../src/lib/court-search";
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
    filterInstitutionGroups(institutionGroups, "lokalna samouprava")[0]
      ?.profiles.length,
    4,
  );
  assert.equal(
    filterInstitutionGroups(institutionGroups, "   "),
    institutionGroups,
  );
});

test("the court directory counts courts separately from departments and applies the 2027 changes on their start date", () => {
  const before = getCourtDirectory("2027-02-28");
  const after = getCourtDirectory("2027-03-01");
  assert.deepEqual(
    before.groups.map((group) => group.courts.length),
    [1, 4, 25, 66, 1, 16, 1, 44, 1],
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

test("municipality search follows court districts and switches the basic court on the effective date", () => {
  const before = getCourtDirectory("2027-02-28");
  const after = getCourtDirectory("2027-03-01");
  const search = (directory: typeof before, name: string) =>
    searchCourtGroups(directory.groups, normalizeCourtSearch(name));
  const courts = (result: ReturnType<typeof search>) =>
    result.groups.flatMap(({ courts }) => courts.map(({ name }) => name));

  const zemun = search(before, "Земун");
  assert.equal(zemun.place, "Земун");
  assert.deepEqual(search(before, "Zemun"), zemun);
  assert.deepEqual(courts(zemun), [
    "Врховни суд",
    "Апелациони суд у Београду",
    "Виши суд у Београду",
    "Трећи основни суд у Београду",
    "Привредни апелациони суд",
    "Привредни суд у Београду",
    "Прекршајни апелациони суд",
    "Прекршајни суд у Београду",
    "Управни суд",
  ]);
  assert.deepEqual(
    courts(search(after, "Zemun")),
    courts(zemun).map((name) => name.replace(/^Трећи /u, "Четврти ")),
  );
  assert.ok(
    courts(search(after, "Novi Beograd")).includes(
      "Трећи основни суд у Београду",
    ),
  );
  assert.ok(
    courts(search(before, "Bac")).includes("Основни суд у Бачкој Паланци"),
  );
  assert.ok(
    !courts(search(before, "Bac")).includes("Апелациони суд у Београду"),
  );
  const kosjeric = search(before, "Kosjeric");
  assert.ok(courts(kosjeric).includes("Апелациони суд у Крагујевцу"));
  assert.equal(
    kosjeric.groups.find(({ title }) => title === "Управни суд")
      ?.departments?.[0]?.name,
    "Одељење у Крагујевцу",
  );
});

test("public contacts belong to the correct court or department and cite official sources", () => {
  const { groups } = getCourtDirectory("2026-11-25");
  const courts = groups.flatMap(({ courts }) => courts);
  const basic =
    groups.find(({ title }) => title === "Основни судови")?.courts ?? [];
  assert.equal(basic.length, 66);
  for (const { name, contact } of basic) {
    assert.ok(
      contact?.addresses.length && contact.phone && contact.email,
      name,
    );
  }
  for (const [name, contact] of Object.entries(courtContacts)) {
    assert.ok(contact?.addresses.length, name);
    assert.equal(courts.find((court) => court.name === name)?.contact, contact);
  }
  for (const [title, contacts] of Object.entries(courtDepartmentContacts)) {
    const departments = groups.find(
      (group) => group.title === title,
    )?.departments;
    for (const [name, contact] of Object.entries(contacts ?? {})) {
      assert.ok(contact?.addresses.length, name);
      assert.equal(
        departments?.find((department) => department.name === name)?.contact,
        contact,
      );
    }
  }
  for (const { contact } of [
    ...courts,
    ...groups.flatMap((group) => group.departments ?? []),
  ]) {
    if (!contact) continue;
    assert.match(
      contact.source,
      /^https:\/\/(?:[^/]+\.sud\.rs|www\.beograd\.rs)\//,
    );
    if (contact.phone) assert.match(contact.phone.number, /^\+381(?: \d+)+$/);
    if (contact.email) assert.match(contact.email.address, /^[^\s@]+@[^\s@]+$/);
  }
});

test("prosecution directory covers statutory districts and lists public office contacts", () => {
  const before = getProsecutionDirectory(getCourtDirectory("2027-02-28"));
  const after = getProsecutionDirectory(getCourtDirectory("2027-03-01"));
  assert.deepEqual(
    before.groups.map(({ offices }) => offices.length),
    [58, 25, 4],
  );
  assert.deepEqual(
    after.groups.map(({ offices }) => offices.length),
    [59, 25, 4],
  );
  for (const { offices } of before.groups) {
    for (const { name, contact } of offices) {
      assert.ok(
        contact?.addresses.length && contact.phone && contact.email,
        name,
      );
      assert.match(contact.phone.number, /^\+381(?: \d+)+$/);
      assert.match(contact.email.address, /^[^\s@]+@[^\s@]+$/);
      assert.match(contact.source, /^https:\/\//);
    }
  }
  const lookup = (data: typeof before, query: string) =>
    searchProsecutionGroups(data.groups, normalizeCourtSearch(query));
  assert.deepEqual(lookup(before, "Zemun"), lookup(before, "Земун"));
  assert.equal(
    lookup(before, "Zemun").groups[0]?.offices[0]?.name,
    "Треће основно јавно тужилаштво у Београду",
  );
  assert.equal(
    lookup(after, "Zemun").groups[0]?.offices[0]?.name,
    "Четврто основно јавно тужилаштво у Београду",
  );
  assert.equal(
    lookup(before, "Presevo").groups[0]?.offices[0]?.name,
    "Основно јавно тужилаштво у Врању",
  );
  assert.equal(
    lookup(before, "Medvedja").groups[0]?.offices[0]?.name,
    "Основно јавно тужилаштво у Лебану",
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
  const courts = getCourtDirectory("2026-11-25");
  for (const group of courts.groups) {
    for (const source of group.sources) citations.add(source.href);
  }
  if (courts.transition) citations.add(courts.transition.source.href);
  for (const source of courts.territorialScope) citations.add(source.href);
  for (const group of getProsecutionDirectory(courts).groups) {
    for (const source of group.sources) citations.add(source.href);
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
