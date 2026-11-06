"use client";
import { useEffect, useState } from "react";
import {
  findSearchSnippet,
  type SearchPassage,
  type SearchSnippet as Snippet,
} from "@/lib/search-snippet";
import { documentUrl } from "@/lib/explorer-url";

export function SearchSnippet({
  id,
  href,
  query,
  returnTo,
}: {
  id: string;
  href: string;
  query: string;
  returnTo: string;
}) {
  const [result, setResult] = useState<{
    key: string;
    snippet: Snippet | null;
    error?: boolean;
  }>();
  const key = `${id}:${query}`;
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(
          `/pagefind/passages/${encodeURIComponent(id)}.json`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Snippet unavailable");
        const passages: SearchPassage[] = await response.json();
        const snippet = findSearchSnippet(passages, query);
        if (!controller.signal.aborted) setResult({ key, snippet });
      } catch {
        if (!controller.signal.aborted)
          setResult({ key, snippet: null, error: true });
      }
    }
    void load();
    return () => controller.abort();
  }, [id, query, key]);
  if (result?.key !== key)
    return (
      <p className="search-snippet" role="status">
        Учитавање одломка…
      </p>
    );
  if (!result.snippet)
    return (
      <p className="search-snippet">
        {result.error
          ? "Одломак није доступан. Отворите цео документ."
          : "За ово подударање нема кратког одломка. Отворите цео документ."}
      </p>
    );
  const snippet = result.snippet;
  return (
    <div className="search-snippet">
      <p>
        <span>Одломак из извора · {snippet.label}</span>
        <br />
        {snippet.before}
        <mark>{snippet.match}</mark>
        {snippet.after}
      </p>
      <a href={documentUrl(href, returnTo, snippet.anchor)}>
        Прочитај у контексту →
      </a>
    </div>
  );
}
