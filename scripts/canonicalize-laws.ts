import { normalizeSearch } from "../src/lib/search";
import type { RegistryRecord } from "../src/lib/registry-types";
type Correction = { canonical: string; duplicates: string[]; reason: string };
export function lawIdentity(r: RegistryRecord) {
  const publication = r.citation
    .slice(r.title.length)
    .match(/\d+\s*\/\s*\d{4}\s*[-–]\s*\d+/)?.[0]
    .replace(/\s/g, "")
    .replace("–", "-");
  return publication ? normalizeSearch(r.title) + "|" + publication : r.id;
}
export function canonicalizeLaws(
  records: RegistryRecord[],
  corrections: Correction[],
) {
  const parent = new Map(records.map((r) => [r.id, r.id]));
  function find(id: string): string {
    const p = parent.get(id);
    if (!p) throw new Error("Missing correction source: " + id);
    if (p === id) return p;
    const root = find(p);
    parent.set(id, root);
    return root;
  }
  const identities = new Map<string, string>();
  for (const r of records) {
    const key = lawIdentity(r),
      existing = identities.get(key);
    if (existing) parent.set(find(r.id), find(existing));
    else identities.set(key, r.id);
  }
  for (const c of corrections) {
    for (const alias of c.duplicates)
      parent.set(find(alias), find(c.canonical));
  }
  const groups = new Map<string, RegistryRecord[]>();
  for (const r of records) {
    const key = find(r.id);
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return [...groups.values()].map((group) => {
    if (group.length === 1) return group[0];
    const explicit = corrections.find((c) =>
      group.some((r) => r.id === c.canonical),
    );
    const chosen =
      group.find((r) => r.id === explicit?.canonical) ??
      group.find((r) => r.sourceFormat === "html") ??
      group[0];
    return {
      ...chosen,
      categories: [...new Set(group.flatMap((r) => r.categories))],
      groups: [...new Set(group.flatMap((r) => r.groups))],
      aliases: group
        .filter((r) => r.id !== chosen.id)
        .map((r) => ({
          id: r.id,
          registryId: r.registryId,
          citation: r.citation,
          sourceUrl: r.sourceUrl,
          sha256: r.sha256,
          fetchedAt: r.fetchedAt,
        })),
      identityNote:
        explicit?.reason ??
        "Same normalized title and original Gazette issue/year/page. Category memberships merged; the HTML version is preferred when available.",
    };
  });
}
