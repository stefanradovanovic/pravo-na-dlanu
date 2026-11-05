"use client";
import { useSyncExternalStore } from "react";
import {
  explorerUrl,
  readExplorerState,
  type ExplorerState,
} from "@/lib/explorer-url";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("explorer-location", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("explorer-location", callback);
  };
}
const snapshot = () => window.location.search;
const serverSnapshot = () => "";
export function useLocationSearch() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
export function useExplorerLocation() {
  const search = useLocationSearch();
  const state = readExplorerState(search);
  function update<K extends keyof ExplorerState>(
    key: K,
    value: ExplorerState[K],
  ) {
    const current = readExplorerState(window.location.search);
    const next = { ...current, [key]: value };
    if (key !== "page") next.page = 0;
    const url = explorerUrl(next);
    if (url === explorerUrl(current)) return;
    // Typing replaces the current search; explicit filters and pages are history entries.
    window.history[key === "query" ? "replaceState" : "pushState"](
      null,
      "",
      url,
    );
    window.dispatchEvent(new Event("explorer-location"));
  }
  return { ...state, update };
}
