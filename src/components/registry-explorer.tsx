"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  X,
  Network,
  List,
  BookOpen,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { Autocomplete, AutocompleteInput } from "@/components/ui/autocomplete";
import { LawSuggestions } from "./law-title-suggestions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  findLawSearchTopic,
  lawSearchExamples,
  normalizeSearch,
  searchLawTitles,
} from "@/lib/search";
import {
  searchLawText,
  suggestLawPassages,
  type LawPassageMatch,
} from "@/lib/full-text-search";
import {
  categoryLabel,
  formatDocumentCount,
  lawPath,
  type Registry,
} from "@/lib/registry-types";
import { useExplorerLocation } from "./explorer-location";
import { documentUrl, explorerUrl } from "@/lib/explorer-url";
import { SearchSnippet } from "./search-snippet";

const constitutionTitle = "Устав Републике Србије";
const featuredDocuments = [
  { title: constitutionTitle, label: "Устав" },
  { title: "Пословник Народне скупштине" },
  { title: "Кривични законик" },
];
const titleSearchExamples = lawSearchExamples.map(({ phrases, title }) => ({
  label: phrases[0],
  query: title,
}));
const detailedSearchExamples = [
  "Пробни рад",
  "Право на жалбу",
  "Уговор на даљину",
].map((query) => ({ label: query, query }));

const RegistryMap = dynamic(
  () => import("./registry-map").then((m) => m.RegistryMap),
  {
    ssr: false,
    loading: () => <div className="map-loading">Учитавање мапе закона…</div>,
  },
);
export function RegistryExplorer({ registry }: { registry: Registry }) {
  const searchInput = useRef<HTMLInputElement>(null);
  const location = useExplorerLocation();
  const { query, view, page, mode, update } = location;
  const [draft, setDraft] = useState(query);
  const [searchFocused, setSearchFocused] = useState(false);
  const [previousQuery, setPreviousQuery] = useState(query);
  if (query !== previousQuery) {
    setPreviousQuery(query);
    setDraft(query);
  }
  const category =
    location.category === "all" ||
    registry.records.some((r) => r.categories.includes(location.category))
      ? location.category
      : "all";
  const setQuery = (value: string) => update("query", value);
  const setCategory = (value: string) => update("category", value);
  const setView = (value: string) => update("view", value);
  const setPage = (value: number) => update("page", value);
  const setMode = (value: string) => update("mode", value);
  const [fullResults, setFullResults] = useState<{
    query: string;
    ids: ReadonlySet<string>;
    error?: string;
  }>({ query: "", ids: new Set() });
  const { records, report } = registry;
  const corpus = records;
  const categories = useMemo(
    () =>
      [...new Set(corpus.flatMap((r) => r.categories))].map((name) => ({
        name,
        count: corpus.filter((r) => r.categories.includes(name)).length,
      })),
    [corpus],
  );
  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "Све области" },
      ...categories.map(({ name }) => ({
        value: name,
        label: categoryLabel(name),
      })),
    ],
    [categories],
  );
  const scopedRecords = useMemo(
    () =>
      category === "all"
        ? corpus
        : corpus.filter((record) => record.categories.includes(category)),
    [corpus, category],
  );
  const normalized = normalizeSearch(query);
  useEffect(() => {
    if (mode !== "full" || !normalized) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const ids = await searchLawText(normalized);
        if (!cancelled) setFullResults({ query: normalized, ids });
      } catch {
        if (!cancelled)
          setFullResults({
            query: normalized,
            ids: new Set(),
            error:
              "Претрага текста тренутно није доступна. Претрага назива и читање докумената раде.",
          });
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, normalized]);
  const matches = useMemo(() => {
    if (!normalized) return scopedRecords;
    if (mode !== "full") return searchLawTitles(scopedRecords, normalized);
    if (fullResults.query !== normalized) return [];
    const records = scopedRecords.filter((record) =>
      fullResults.ids.has(record.id),
    );
    const topic = findLawSearchTopic(normalized);
    if (topic) {
      const index = records.findIndex(({ title }) => title === topic.title);
      if (index > 0) records.unshift(...records.splice(index, 1));
    }
    return records;
  }, [scopedRecords, normalized, mode, fullResults]);
  const searching = !!normalized;
  const showingMap = view === "map" && !searching;
  const size = 20;
  const pageCount = Math.max(1, Math.ceil(matches.length / size));
  const currentPage = showingMap ? 0 : Math.min(page, pageCount - 1);
  const returnTo = explorerUrl({
    query,
    category,
    view,
    mode,
    page: currentPage,
  });
  const shortcutClassName = buttonVariants({ variant: "ghost", size: "sm" });
  const suggestionQuery = normalizeSearch(draft);
  const titleSuggestions = useMemo(
    () =>
      mode !== "titles" || suggestionQuery.length < 3
        ? []
        : searchLawTitles(scopedRecords, suggestionQuery).slice(0, 6),
    [mode, scopedRecords, suggestionQuery],
  );
  const [passageSuggestions, setPassageSuggestions] = useState<{
    query: string;
    category: string;
    matches: LawPassageMatch[];
  }>();
  useEffect(() => {
    if (mode !== "full" || !searchFocused || suggestionQuery.length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const matches = await suggestLawPassages(
          suggestionQuery,
          scopedRecords,
          category,
          controller.signal,
        );
        if (!controller.signal.aborted)
          setPassageSuggestions({ query: suggestionQuery, category, matches });
      } catch {
        if (!controller.signal.aborted)
          setPassageSuggestions({
            query: suggestionQuery,
            category,
            matches: [],
          });
      }
    }, 240);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [mode, searchFocused, suggestionQuery, scopedRecords, category]);
  const suggestionState = {
    query: draft,
    category,
    view,
    mode,
    page: 0,
  };
  const suggestionReturn = explorerUrl(suggestionState);
  const suggestions =
    mode === "full"
      ? passageSuggestions?.query === suggestionQuery &&
        passageSuggestions.category === category
        ? passageSuggestions.matches.map(({ law, snippet }) => {
            const suffix = snippet.after.match(/^[\p{L}\p{M}\p{N}]+/u)?.[0];
            const returnUrl = suffix
              ? explorerUrl({
                  ...suggestionState,
                  query: snippet.match + suffix,
                })
              : suggestionReturn;
            return {
              title: law.title,
              href: documentUrl(lawPath(law), returnUrl, snippet.anchor),
              snippet,
            };
          })
        : []
      : titleSuggestions.map((law) => ({
          title: law.title,
          href: documentUrl(lawPath(law), suggestionReturn),
        }));
  const searchExamples =
    mode === "full" ? detailedSearchExamples : titleSearchExamples;
  const visible = matches.slice(currentPage * size, (currentPage + 1) * size);
  const waiting =
    mode === "full" && searching && fullResults.query !== normalized;
  const chooseCategory = (value: string) => {
    setCategory(value);
    setPage(0);
  };
  return (
    <>
      <div className="catalog-intro">
        <div className="catalog-intro-copy">
          <div className="eyebrow">БИБЛИОТЕКА ПРОПИСА</div>
          <h1>Упознајте своја права.</h1>
          <p className="heading-description">
            Пронађите пропис, прочитајте цео текст и проверите извор.
          </p>
          <nav className="home-document-links" aria-label="Издвојени прописи">
            {featuredDocuments.map(({ title, label }) => {
              const law = corpus.find((record) => record.title === title);
              if (!law) return null;
              return (
                <a
                  key={law.id}
                  href={documentUrl(lawPath(law), returnTo)}
                  className={shortcutClassName}
                >
                  {label ?? law.title} <ArrowUpRight aria-hidden="true" />
                </a>
              );
            })}
          </nav>
        </div>
        <Tabs
          className="catalog-search"
          value={mode}
          onValueChange={(value) => {
            if (value) {
              setMode(value);
              setPage(0);
            }
          }}
        >
          <TabsList aria-label="Обим претраге" variant="line">
            <TabsTrigger value="titles">Прописи</TabsTrigger>
            <TabsTrigger value="full">Детаљна претрага</TabsTrigger>
          </TabsList>
          <TabsContent value={mode}>
            <form
              id="pretraga"
              className="search-wrap"
              role="search"
              aria-label="Претрага прописа"
              tabIndex={-1}
              onSubmit={(event) => {
                event.preventDefault();
                setQuery(draft);
              }}
            >
              <Search size={16} aria-hidden="true" />
              <Autocomplete
                value={draft}
                filter={false}
                openOnFocus={suggestionQuery.length >= 3}
                announcement={(change) =>
                  change.type === "results" && change.count
                    ? `${mode === "full" ? "Предложени одломци" : "Предложени прописи"}: ${change.count}.`
                    : null
                }
                onValueChange={(value, details) => {
                  if (details.reason !== "item-press") setDraft(value);
                }}
              >
                <AutocompleteInput
                  ref={searchInput}
                  className="pl-9 pr-20"
                  aria-label="Претрага закона"
                  enterKeyHint="search"
                  placeholder={
                    mode === "full"
                      ? "Реч или фраза из текста прописа…"
                      : "Назив прописа…"
                  }
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                <LawSuggestions matches={suggestions} query={draft} />
              </Autocomplete>
              {draft && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="catalog-search-clear"
                  aria-label="Обриши претрагу"
                  onClick={() => {
                    setDraft("");
                    searchInput.current?.focus();
                  }}
                >
                  <X />
                </Button>
              )}
              {draft && (
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Претражи законе"
                >
                  <Search aria-hidden="true" />
                </Button>
              )}
              {!draft && <span className="search-hint">Ћир / лат</span>}
            </form>
            <div className="suggestions" aria-label="Предлози претраге">
              {searchExamples.map(({ label, query }) => (
                <Button
                  variant="ghost"
                  size="sm"
                  key={label}
                  title={query}
                  onClick={() => {
                    setQuery(query);
                    setCategory("all");
                    setPage(0);
                  }}
                >
                  {label}
                  <ArrowUpRight size={12} />
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className="workspace">
        <section className="explorer" aria-label="Истраживач закона">
          <Tabs
            className="catalog-views"
            value={showingMap ? "map" : "list"}
            onValueChange={(value) => {
              if (value) {
                setView(value);
                setPage(0);
              }
            }}
          >
            <div className="explorer-header">
              <div>
                <div className="eyebrow muted">БИБЛИОТЕКА ПРОПИСА</div>
                <h2>
                  {searching
                    ? "Резултати претраге"
                    : category === "all"
                      ? "Прописи Републике Србије"
                      : categoryLabel(category)}
                </h2>
                <p className="heading-description">
                  {searching
                    ? mode === "full"
                      ? "Претрага фразе у тексту"
                      : "Претрага назива прописа"
                    : "Изаберите област и истражите прописе који јој припадају."}
                </p>
              </div>
              <TabsList aria-label="Начин приказа">
                <TabsTrigger value="map" disabled={searching}>
                  <Network /> Мапа
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List /> Листа
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value={showingMap ? "map" : "list"}>
              <div className="collection-bar">
                <div className="collection-summary">
                  {!showingMap && (
                    <Select
                      items={categoryOptions}
                      value={category}
                      onValueChange={(value) => {
                        if (value !== null) chooseCategory(value);
                      }}
                    >
                      <SelectTrigger
                        aria-label="Правна област"
                        className="max-w-full min-w-0"
                      >
                        <SelectValue className="truncate" />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {categoryOptions.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {!waiting &&
                    !(mode === "full" && searching && fullResults.error) && (
                      <span role="status" aria-live="polite" aria-atomic="true">
                        <SlidersHorizontal size={14} aria-hidden="true" />
                        {formatDocumentCount(matches.length)}
                      </span>
                    )}
                </div>
                <span>
                  Преузето{" "}
                  {new Date(report.finishedAt).toLocaleDateString("sr-RS", {
                    timeZone: "Europe/Belgrade",
                  })}
                  <Badge variant="outline">ПИС РС</Badge>
                </span>
              </div>
              {waiting ? (
                <div className="map-loading" role="status">
                  Претраживање текста закона…
                </div>
              ) : fullResults.error && mode === "full" && searching ? (
                <div className="empty-state" role="alert">
                  <p>{fullResults.error}</p>
                  <Button variant="outline" onClick={() => setMode("titles")}>
                    Претражи називе
                  </Button>
                </div>
              ) : showingMap ? (
                <RegistryMap
                  categories={categories}
                  records={matches}
                  category={category}
                  onCategory={chooseCategory}
                  returnTo={returnTo}
                />
              ) : (
                <>
                  <div className="law-list">
                    {visible.length ? (
                      visible.map((r, i) => (
                        <div className="law-list-row" key={r.id}>
                          <span className="law-index">
                            {currentPage * size + i + 1}
                          </span>
                          <BookOpen size={21} />
                          <div>
                            <h3>
                              <a href={documentUrl(lawPath(r), returnTo)}>
                                {r.title}
                              </a>
                            </h3>
                            <p>{r.categories.map(categoryLabel).join(" · ")}</p>
                            <small>
                              {r.citation
                                .slice(r.title.length)
                                .replace(/^:\s*/, "")}{" "}
                              ·{" "}
                              {r.textStatus === "complete"
                                ? "Цео текст ПИС-а"
                                : r.textStatus === "facsimile"
                                  ? "Цео закон у факсимилу"
                                  : r.sourceIssue
                                    ? "Потребна провера извора"
                                    : "Изворни PDF"}
                            </small>
                            {mode === "full" && searching && (
                              <SearchSnippet
                                id={r.id}
                                href={lawPath(r)}
                                query={normalized}
                                returnTo={returnTo}
                              />
                            )}
                          </div>
                          <ArrowUpRight size={19} />
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <Search size={30} />
                        <h3>Нема резултата у овој збирци.</h3>
                        <p>
                          Пробајте другу реч, претрагу целог текста или све
                          законе.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setQuery("");
                            chooseCategory("all");
                          }}
                        >
                          Прикажи све законе
                        </Button>
                      </div>
                    )}
                  </div>
                  {pageCount > 1 && (
                    <div className="catalog-pagination">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!currentPage}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        Претходна
                      </Button>
                      <span>
                        {currentPage + 1} / {pageCount}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage + 1 >= pageCount}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        Следећа
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </>
  );
}
