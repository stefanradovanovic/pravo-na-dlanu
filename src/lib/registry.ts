import fs from "node:fs";
import path from "node:path";
import type { Registry, RegistryRecord } from "./registry-types";

let snapshot: { mtime: number; value: Registry } | undefined;
export function getRegistry(): Registry {
  const file = path.join(process.cwd(), "content/registry.json"),
    mtime = fs.statSync(file).mtimeMs;
  if (!snapshot || snapshot.mtime !== mtime)
    snapshot = { mtime, value: JSON.parse(fs.readFileSync(file, "utf8")) };
  return snapshot.value;
}
export function getLawDocument(id: string) {
  const record = getRegistry().records.find((r) => r.id === id);
  if (!record) return null;
  const raw = fs
    .readFileSync(
      path.join(process.cwd(), "content/corpus", record.id + ".md"),
      "utf8",
    )
    .replace(/\r\n/g, "\n");
  const end = raw.indexOf("\n---\n", 4);
  if (end < 0) throw new Error(`Invalid document: ${id}`);
  return { record, markdown: raw.slice(end + 5).trim() };
}
export function findLearningLaw(slug: string): RegistryRecord | undefined {
  const titles: Record<string, string> = {
    ustav: "Устав Републике Србије",
    "zakon-o-radu": "Закон о раду",
    "zastita-podataka": "Закон о заштити података о личности",
    "pristup-informacijama":
      "Закон о слободном приступу информацијама од јавног значаја",
    "zabrana-diskriminacije": "Закон о забрани дискриминације",
  };
  return getRegistry().records.find((r) => r.title === titles[slug]);
}
