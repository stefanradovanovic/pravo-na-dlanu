"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Autocomplete, AutocompleteInput } from "@/components/ui/autocomplete";
import { normalizeSearch, searchLawTitles } from "@/lib/search";
import { LawSuggestions, type LawSuggestion } from "./law-title-suggestions";

let titleRequest: Promise<LawSuggestion[]> | undefined;

function loadTitles() {
  return (titleRequest ??= fetch("/law-titles.json")
    .then(async (response) => {
      if (!response.ok) throw new Error("Law titles unavailable");
      return (await response.json()) as LawSuggestion[];
    })
    .catch((error) => {
      titleRequest = undefined;
      throw error;
    }));
}

export function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [titles, setTitles] = useState<LawSuggestion[]>([]);
  const matches =
    normalizeSearch(query).length >= 3 ? searchLawTitles(titles, query) : [];

  return (
    <form
      className="header-search"
      action="/"
      method="get"
      role="search"
      aria-label="Претрага из заглавља"
    >
      <Autocomplete
        name="q"
        value={query}
        filter={false}
        onValueChange={(value, details) => {
          if (details.reason !== "item-press") setQuery(value);
        }}
      >
        <AutocompleteInput
          aria-label="Претрага из заглавља"
          placeholder="Пронађи пропис…"
          type="search"
          onFocus={() => {
            if (!titles.length) void loadTitles().then(setTitles, () => {});
          }}
        />
        <LawSuggestions matches={matches} query={query} />
      </Autocomplete>
      <input type="hidden" name="view" value="list" />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        aria-label="Претражи прописе"
      >
        <Search size={18} aria-hidden="true" />
      </Button>
    </form>
  );
}
