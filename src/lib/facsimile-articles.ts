import facsimileTopics from "../../content/facsimile-article-topics.json";
import type { Facsimile } from "./registry-types";

export type FacsimileArticle = {
  number: number;
  page: number;
  top: number;
  left: number;
  subtitle: string;
};

const topics: Record<
  string,
  { parts: string[]; articles: FacsimileArticle[] }
> = facsimileTopics;

export function getFacsimileArticles(id: string, scan: Facsimile) {
  const pinned = topics[id];
  if (
    !pinned ||
    pinned.parts.length !== scan.parts.length ||
    pinned.parts.some((hash, index) => hash !== scan.parts[index].sha256)
  )
    return [];
  return pinned.articles;
}
