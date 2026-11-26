"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Autocomplete, AutocompleteInput } from "@/components/ui/autocomplete";
import { normalizeSearch, searchLawTitles } from "@/lib/search";
import { featuredDocuments } from "@/lib/registry-types";
import { LawSuggestions, type LawSuggestion } from "./law-title-suggestions";
import { searchNavigationHref } from "./site-navigation";

const searchFormId = "header-law-search";

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
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const mobileTrigger = useRef<HTMLAnchorElement>(null);
  const [query, setQuery] = useState("");
  const [titles, setTitles] = useState<LawSuggestion[]>([]);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [animateMobile, setAnimateMobile] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const normalizedQuery = normalizeSearch(query);
  const matches =
    normalizedQuery.length >= 3
      ? searchLawTitles(titles, query)
      : mobileExpanded && !normalizedQuery
        ? featuredDocuments.flatMap(({ title }) => {
            const law = titles.find((candidate) => candidate.title === title);
            return law ? [law] : [];
          })
        : [];

  const closeMobile = useCallback((restoreFocus = false) => {
    setMobileExpanded(false);
    setSuggestionsOpen(false);
    mobileTrigger.current?.setAttribute("aria-expanded", "false");
    if (restoreFocus) {
      const trigger = mobileTrigger.current;
      requestAnimationFrame(() => trigger?.focus({ preventScroll: true }));
    }
  }, []);

  useEffect(() => {
    if (!mobileExpanded) return;
    const covered = form.current
      ?.closest(".site-header")
      ?.querySelectorAll<HTMLElement>(
        ".brand, nav, .header-search-mobile, #site-theme-toggle",
      );
    covered?.forEach((element) => {
      element.inert = true;
    });
    return () => {
      covered?.forEach((element) => {
        element.inert = false;
      });
    };
  }, [mobileExpanded]);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 800px)");
    function handlePress(event: MouseEvent) {
      if (!mobile.matches || !(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>(
        ".mobile-navigation a, .header-search-mobile",
      );
      if (anchor?.getAttribute("href") === searchNavigationHref) {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        if (mobileExpanded && mobileTrigger.current === anchor) {
          closeMobile(true);
          return;
        }
        mobileTrigger.current?.setAttribute("aria-expanded", "false");
        mobileTrigger.current = anchor;
        anchor.setAttribute("aria-controls", searchFormId);
        anchor.setAttribute("aria-expanded", "true");
        // Focus in the original tap so mobile browsers can open the keyboard.
        flushSync(() => {
          setMobileExpanded(true);
          setAnimateMobile(event.detail > 0);
          setSuggestionsOpen(true);
        });
        input.current?.focus({ preventScroll: true });
      } else if (
        mobileExpanded &&
        !form.current?.contains(event.target) &&
        !event.target.closest(".header-search-suggestions")
      ) {
        closeMobile();
      }
    }
    function handleViewportChange() {
      if (!mobile.matches && mobileExpanded) closeMobile();
    }
    document.addEventListener("click", handlePress, true);
    mobile.addEventListener("change", handleViewportChange);
    return () => {
      document.removeEventListener("click", handlePress, true);
      mobile.removeEventListener("change", handleViewportChange);
    };
  }, [closeMobile, mobileExpanded]);

  return (
    <form
      id={searchFormId}
      ref={form}
      className="header-search"
      data-mobile-expanded={mobileExpanded || undefined}
      data-mobile-animate={animateMobile || undefined}
      action="/"
      method="get"
      role="search"
      aria-label="Претрага из заглавља"
      onKeyDown={(event) => {
        if (
          mobileExpanded &&
          event.key === "Escape" &&
          (!suggestionsOpen || !matches.length)
        ) {
          event.preventDefault();
          closeMobile(true);
        }
      }}
    >
      {mobileExpanded && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="mobile-search-close"
          aria-label="Затвори претрагу"
          onClick={() => closeMobile(true)}
        >
          <X size={18} aria-hidden="true" />
        </Button>
      )}
      <Autocomplete
        name="q"
        value={query}
        open={suggestionsOpen}
        onOpenChange={setSuggestionsOpen}
        openOnFocus={mobileExpanded}
        filter={false}
        onValueChange={(value, details) => {
          if (details.reason !== "item-press") setQuery(value);
        }}
      >
        <AutocompleteInput
          ref={input}
          aria-label="Претрага из заглавља"
          placeholder="Пронађи пропис…"
          type="search"
          enterKeyHint="search"
          onFocus={() => {
            if (!titles.length) void loadTitles().then(setTitles, () => {});
          }}
        />
        <LawSuggestions
          matches={matches}
          contentProps={{
            align: "end",
            className: "header-search-suggestions",
          }}
        />
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
