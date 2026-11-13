"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Search,
  X,
  Network,
  List,
  BookOpen,
  ArrowUpRight,
  Scale,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { normalizeSearch, searchLawTitles } from "@/lib/search";
import { categoryLabel, lawPath } from "@/lib/registry-types";
import type { Catalog, CatalogRecord } from "@/lib/catalog";
import { searchFullText, type SearchEngine } from "@/lib/full-text-search";
import { useExplorerLocation } from "./explorer-location";
import { documentUrl, explorerUrl } from "@/lib/explorer-url";
import { SearchSnippet } from "./search-snippet";
import { learningTopics, searchLearningTopics } from "@/lib/learning";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const RegistryMap = dynamic(
  () => import("./registry-map").then((m) => m.RegistryMap),
  {
    ssr: false,
    loading: () => <div className="map-loading">Учитавање мапе закона…</div>,
  },
);
let searchModule: Promise<SearchEngine> | undefined;
function loadSearch() {
  const modulePath = "/pagefind/pagefind.js";
  return (searchModule ??= import(/* webpackIgnore: true */ modulePath).catch(
    (error) => {
      searchModule = undefined;
      throw error;
    },
  ) as Promise<SearchEngine>);
}

export function RegistryExplorer({ registry }: { registry: Catalog }) {
  const location = useExplorerLocation();
  const { query, view, page, mode, update } = location;
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
    key: string;
    records: CatalogRecord[];
    count: number;
    page: number;
    error?: string;
  }>({ key: "", records: [], count: 0, page: 0 });
  const { records, report } = registry;
  const corpus = records;
  const constitution = corpus.find((r) => r.title === "Устав Републике Србије");
  const categories = useMemo(
    () =>
      [...new Set(corpus.flatMap((r) => r.categories))].map((name) => ({
        name,
        count: corpus.filter((r) => r.categories.includes(name)).length,
      })),
    [corpus],
  );
  const normalized = normalizeSearch(query);
  const fullSearch = mode !== "titles" && !!normalized;
  const searchKey = JSON.stringify([mode, normalized, category, page]);
  const suggestedTopics = normalized ? searchLearningTopics(query) : [];
  useEffect(() => {
    if (!fullSearch) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const engine = await loadSearch();
        const result = await searchFullText(
          engine,
          records,
          normalized,
          category,
          page,
          mode === "phrase",
        );
        if (!cancelled) setFullResults({ key: searchKey, ...result });
      } catch {
        if (!cancelled)
          setFullResults({
            key: searchKey,
            records: [],
            count: 0,
            page: 0,
            error:
              "Претрага текста тренутно није доступна. Претрага назива и читање докумената раде.",
          });
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fullSearch, mode, normalized, category, page, records, searchKey]);
  const matches = useMemo(() => {
    let list = corpus.filter(
      (r) => category === "all" || r.categories.includes(category),
    );
    if (normalized && !fullSearch) list = searchLawTitles(list, normalized);
    return list;
  }, [corpus, category, normalized, fullSearch]);
  const searching = !!normalized;
  const showingMap = view === "map" && !searching;
  const size = showingMap ? 8 : 20;
  const readyResults = fullResults.key === searchKey;
  const count = fullSearch
    ? readyResults
      ? fullResults.count
      : 0
    : matches.length;
  const pageCount = Math.max(1, Math.ceil(count / size));
  const currentPage =
    fullSearch && readyResults
      ? fullResults.page
      : Math.min(page, pageCount - 1);
  const returnTo = explorerUrl({
    query,
    category,
    view,
    mode,
    page: currentPage,
  });
  const visible = fullSearch
    ? readyResults
      ? fullResults.records
      : []
    : matches.slice(currentPage * size, (currentPage + 1) * size);
  const waiting = fullSearch && !readyResults;
  const chooseCategory = (value: string) => {
    setCategory(value);
    setPage(0);
  };
  return (
    <main
      id="main"
      className={`catalog-page${searching ? " is-searching" : ""}`}
    >
      <div className="page-intro catalog-intro">
        <div className="eyebrow">
          <span /> ПРАВО ПРИПАДА СВИМА
        </div>
        <h1>
          {searching
            ? "Пронађите закон или правило."
            : "Упознајте своја права."}
        </h1>
        <p>
          Устав и закони Србије — претражите збирку или почните од животне
          ситуације.
        </p>
        <div id="pretraga" className="search-wrap" tabIndex={-1}>
          <Search size={16} aria-hidden="true" />
          <Input
            className="pl-9 pr-20"
            aria-label="Претрага закона"
            placeholder="Закон, плата, годишњи одмор…"
            aria-describedby="catalog-search-help"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Обриши претрагу"
              onClick={() => {
                setQuery("");
                setPage(0);
              }}
            >
              <X />
            </Button>
          )}
          {!query && <span className="search-hint">Ћир / лат</span>}
        </div>
        <p id="catalog-search-help" className="catalog-search-help">
          Ћирилица и латиница, са или без квачица.
        </p>
        <div className="suggestions">
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(String(v));
              setPage(0);
            }}
          >
            <TabsList aria-label="Обим претраге">
              <TabsTrigger value="titles">Назив закона</TabsTrigger>
              <TabsTrigger value="full">Цео текст</TabsTrigger>
              <TabsTrigger value="phrase">Тачна фраза</TabsTrigger>
            </TabsList>
          </Tabs>
          {[
            { label: "Рад", title: "Закон о раду" },
            {
              label: "Саобраћај",
              title: "Закон о безбедности саобраћаја на путевима",
            },
            { label: "Потрошач", title: "Закон о заштити потрошача" },
          ].map(({ label, title }) => (
            <Button
              variant="ghost"
              size="sm"
              key={label}
              title={title}
              onClick={() => {
                setQuery(title);
                setMode("titles");
                setCategory("all");
                setPage(0);
              }}
            >
              {label}
              <ArrowUpRight size={12} />
            </Button>
          ))}
        </div>
      </div>
      {!searching && category === "all" && (
        <section
          className="citizen-start"
          aria-labelledby="citizen-start-title"
        >
          <div className="learning-section-heading">
            <div>
              <span className="eyebrow">ОД СИТУАЦИЈЕ ДО ПРАВИЛА</span>
              <h2 id="citizen-start-title">Шта вас занима?</h2>
            </div>
          </div>
          <div className="citizen-topic-list">
            {learningTopics.map((topic) => (
              <Link
                key={topic.id}
                href={`/ucenje?tema=${topic.id}`}
                className={buttonVariants({ variant: "outline" })}
              >
                {topic.title} <ArrowUpRight />
              </Link>
            ))}
          </div>
          <div className="citizen-help-links">
            <Link href="/ucenje" className="text-link">
              Учи и провери знање <span aria-hidden="true">→</span>
            </Link>
            <Link href="/vodic" className="text-link">
              Како читати закон <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      )}
      <div className="workspace">
        <aside className="browse-sidebar registry-sidebar">
          <p className="sidebar-label">ВАШ ВОДИЧ</p>
          <Link
            className={buttonVariants({
              variant: "ghost",
              className: "side-link active",
            })}
            href={returnTo}
          >
            <Network size={16} /> Истражи право
          </Link>
          <div className="sidebar-divider" />
          <p className="sidebar-label">ПРАВНЕ ОБЛАСТИ</p>
          <Button
            variant="ghost"
            className={`topic-link ${category === "all" ? "active" : ""}`}
            onClick={() => chooseCategory("all")}
          >
            <span className="topic-dot all" /> Све области{" "}
            <span>{corpus.length}</span>
          </Button>
          <div className="category-scroll">
            {categories.map((c, i) => (
              <Button
                variant="ghost"
                title={c.name}
                key={c.name}
                className={`topic-link category-link ${category === c.name ? "active" : ""}`}
                onClick={() => chooseCategory(c.name)}
              >
                <span
                  className="topic-dot"
                  style={{
                    background: `var(--chart-${(i % 4) + 1})`,
                  }}
                />
                <span className="category-name">{categoryLabel(c.name)}</span>
                <span>{c.count}</span>
              </Button>
            ))}
          </div>
          <div className="constitution-note">
            <Scale size={25} />
            <h3>Све почиње Уставом.</h3>
            <p>Прочитајте цео Устав Републике Србије.</p>
            <a
              href={documentUrl(
                constitution ? lawPath(constitution) : "/zakoni/ustav",
                returnTo,
              )}
            >
              Отвори документ <ArrowUpRight size={14} />
            </a>
          </div>
        </aside>
        <section className="explorer" aria-label="Истраживач закона">
          <div className="catalog-mobile-filter">
            <label id="category-label">Правна област</label>
            <Select
              value={category}
              onValueChange={(value) => chooseCategory(String(value))}
            >
              <SelectTrigger
                aria-labelledby="category-label"
                className="w-full"
              >
                <SelectValue>
                  {category === "all" ? "Све области" : categoryLabel(category)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Све области · {corpus.length}
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    <span className="whitespace-normal">
                      {categoryLabel(c.name)} · {c.count}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {searching && suggestedTopics.length > 0 && (
            <section className="search-topics" aria-label="Теме и објашњења">
              <h2>Теме и објашњења</h2>
              <p>
                Уреднички водичи и измишљени примери, одвојени од текста закона.
              </p>
              <div className="search-topic-links">
                {suggestedTopics.map((topic) => {
                  const law = corpus.find(
                    (record) => record.topicId === topic.id,
                  );
                  return (
                    <div key={topic.id}>
                      <Link
                        href={`/ucenje?tema=${topic.id}`}
                        className={buttonVariants({ variant: "outline" })}
                      >
                        {topic.title} <ArrowUpRight />
                      </Link>
                      {law && (
                        <a
                          className="text-link"
                          href={documentUrl(lawPath(law), returnTo)}
                        >
                          Извор: {law.title} →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          <div className="explorer-header">
            <div>
              <div className="eyebrow muted">БИБЛИОТЕКА ПРОПИСА</div>
              <h2>
                {searching
                  ? "Резултати претраге"
                  : category === "all"
                    ? "Библиотека закона"
                    : categoryLabel(category)}
              </h2>
              <p>
                {searching
                  ? waiting
                    ? "Претраживање текста закона…"
                    : `${count} докумената · ${mode === "phrase" ? "тачна фраза у тексту" : mode === "full" ? "речи у тексту · по релевантности" : "назив закона"}`
                  : "Изаберите област и истражите законе који јој припадају."}
              </p>
            </div>
            <Tabs
              value={searching ? "list" : view}
              onValueChange={(v) => {
                setView(String(v));
                setPage(0);
              }}
            >
              <TabsList aria-label="Начин приказа">
                <TabsTrigger value="map" disabled={searching}>
                  <Network /> Мапа
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List /> Листа
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="collection-bar">
            <span>
              <SlidersHorizontal size={14} />
              {waiting ? "Претрага…" : `${count} докумената`}
            </span>
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
          ) : readyResults && fullResults.error && fullSearch ? (
            <div className="empty-state" role="alert">
              <p>{fullResults.error}</p>
              <Button variant="outline" onClick={() => setMode("titles")}>
                Претражи називе
              </Button>
            </div>
          ) : showingMap ? (
            <RegistryMap
              categories={categories}
              records={visible}
              category={category}
              onCategory={chooseCategory}
              total={count}
              page={currentPage}
              onPage={setPage}
              returnTo={returnTo}
            />
          ) : (
            <>
              <div className="law-list" aria-live="polite">
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
                        {fullSearch && (
                          <SearchSnippet
                            id={r.id}
                            href={lawPath(r)}
                            query={normalized}
                            returnTo={returnTo}
                            phrase={mode === "phrase"}
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
                      {mode === "titles"
                        ? "Називи не садрже ове речи. Потражите их у тексту закона."
                        : "Пробајте краћу претрагу или другу правну област."}
                    </p>
                    <div className="learning-actions">
                      {mode !== "full" && (
                        <Button onClick={() => setMode("full")}>
                          Претражи цео текст
                        </Button>
                      )}
                      {category !== "all" && (
                        <Button
                          variant="outline"
                          onClick={() => chooseCategory("all")}
                        >
                          Претражи све области
                        </Button>
                      )}
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
          <div className="source-banner">
            <Info size={18} />
            <div>
              <strong>
                {report.importedRecords.toLocaleString("sr-RS")} докумената ·
                искључиво ПИС
              </strong>
              <p>
                {report.fullTextRecords?.toLocaleString("sr-RS")} HTML текстова;{" "}
                {(report.facsimileRecords ?? 0).toLocaleString("sr-RS")} у
                факсимилу. Домаћи закони и Устав из актуелног регистра ПИС-а.
                Сваки закон има један документ. Погледајте обухват и проверу
                извора.
              </p>
              {!!report.sourceOnlyRecords && (
                <p className="source-warning">
                  {report.sourceOnlyRecords.toLocaleString("sr-RS")} записа још
                  нема локални пуни документ.
                </p>
              )}
              {report.failureCount > 0 && (
                <p className="source-warning">
                  {report.failureCount} текстова није преузето. Обухват још није
                  потпун.
                </p>
              )}
            </div>
            <Link href="/o-projektu">
              О изворима <ArrowUpRight size={13} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
