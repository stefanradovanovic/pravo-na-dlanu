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
  Sparkles,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { normalizeSearch } from "@/lib/search";
import {
  categoryLabel,
  isTreaty,
  lawPath,
  type Registry,
} from "@/lib/registry-types";
const RegistryMap = dynamic(
  () => import("./registry-map").then((m) => m.RegistryMap),
  {
    ssr: false,
    loading: () => <div className="map-loading">Учитавање мапе закона…</div>,
  },
);
type SearchHit = { id: string };
type SearchModule = {
  filters: () => Promise<unknown>;
  search: (
    query: string,
  ) => Promise<{ filters: { law: Record<string, number> } }>;
};
let searchModule: Promise<SearchModule> | undefined;
function loadSearch() {
  const modulePath = "/pagefind/pagefind.js";
  return (searchModule ??= import(/* webpackIgnore: true */ modulePath)
    .then(async (engine) => {
      await engine.filters();
      return engine;
    })
    .catch((error) => {
      searchModule = undefined;
      throw error;
    }) as Promise<SearchModule>);
}

export function RegistryExplorer({ registry }: { registry: Registry }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [scope, setScope] = useState("national");
  const [view, setView] = useState("map");
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState("titles");
  const [fullResults, setFullResults] = useState<{
    query: string;
    hits: SearchHit[];
    error?: string;
  }>({ query: "", hits: [] });
  const { records, report } = registry;
  const corpus = useMemo(
    () =>
      records.filter(
        (r) =>
          scope === "all" ||
          (scope === "treaties" ? isTreaty(r) : !isTreaty(r)),
      ),
    [records, scope],
  );
  const categories = useMemo(
    () =>
      [...new Set(corpus.flatMap((r) => r.categories))].map((name) => ({
        name,
        count: corpus.filter((r) => r.categories.includes(name)).length,
      })),
    [corpus],
  );
  const prepared = useMemo(
    () =>
      new Map(
        records.map((r) => [
          r.id,
          normalizeSearch(`${r.title} ${r.citation} ${r.groups.join(" ")}`),
        ]),
      ),
    [records],
  );
  const normalized = normalizeSearch(query);
  useEffect(() => {
    if (mode !== "full" || !normalized) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const engine = await loadSearch();
        const result = await engine.search(
          normalized.includes(" ") ? `"${normalized}"` : normalized,
        );
        // Per-law facets identify matches without downloading every result's full content.
        const hits = Object.entries(result.filters.law ?? {})
          .filter(([, count]) => count > 0)
          .map(([id]) => ({ id }));
        if (!cancelled) setFullResults({ query: normalized, hits });
      } catch {
        if (!cancelled)
          setFullResults({
            query: normalized,
            hits: [],
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
    let list = corpus.filter(
      (r) => category === "all" || r.categories.includes(category),
    );
    if (normalized) {
      if (mode === "full") {
        const ids = new Set(
          fullResults.query === normalized
            ? fullResults.hits.map((h) => h.id)
            : [],
        );
        list = list.filter((r) => ids.has(r.id));
      } else {
        const tokens = normalized.split(" ");
        list = list.filter((r) =>
          tokens.every((t) =>
            prepared
              .get(r.id)!
              .split(" ")
              .some((word) => (t.length < 3 ? word === t : word.startsWith(t))),
          ),
        );
        list.sort(
          (a, b) =>
            Number(normalizeSearch(b.title) === normalized) -
              Number(normalizeSearch(a.title) === normalized) ||
            Number(normalizeSearch(b.title).includes(normalized)) -
              Number(normalizeSearch(a.title).includes(normalized)),
        );
      }
    }
    return list;
  }, [corpus, category, normalized, mode, fullResults, prepared]);
  const searching = !!normalized;
  const showingMap = view === "map" && !searching;
  const size = showingMap ? 8 : 20;
  const pageCount = Math.max(1, Math.ceil(matches.length / size));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = matches.slice(currentPage * size, (currentPage + 1) * size);
  const waiting =
    mode === "full" && searching && fullResults.query !== normalized;
  const chooseCategory = (value: string) => {
    setCategory(value);
    setPage(0);
  };
  return (
    <main id="main">
      <div className="page-intro">
        <div className="eyebrow">
          <span /> ПРАВО ПРИПАДА СВИМА
        </div>
        <h1>
          Упознајте своја права.
          <br />
          <span>Разумите како су повезана.</span>
        </h1>
        <p>
          Устав и закони Србије на једном месту.
          <br className="desktop-break" /> Истражите правне области и прочитајте
          сваки закон као цео документ.
        </p>
        <div className="search-wrap">
          <Search size={21} />
          <Input
            aria-label="Претрага закона"
            placeholder="Претражите законе — нпр. рад, саобраћај, заштита потрошача…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Обриши претрагу"
              onClick={() => {
                setQuery("");
                setPage(0);
              }}
            >
              <X />
            </Button>
          )}
          <span className="search-hint">Ћир / Lat</span>
        </div>
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
            </TabsList>
          </Tabs>
          {["Рад", "Саобраћај", "Потрошач"].map((s) => (
            <Button
              variant="ghost"
              size="sm"
              key={s}
              onClick={() => {
                setQuery(s);
                setCategory("all");
                setPage(0);
              }}
            >
              {s}
              <ArrowUpRight size={12} />
            </Button>
          ))}
        </div>
      </div>
      <div className="workspace">
        <aside className="browse-sidebar registry-sidebar">
          <p className="sidebar-label">ВАШ ВОДИЧ</p>
          <Link className="side-link active" href="/">
            <Network size={16} /> Истражи право
          </Link>
          <Link className="side-link" href="/ucenje">
            <Sparkles size={16} /> Примери из живота
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
                    background: ["#7c8e71", "#ae8c63", "#8d88a0", "#82a1a3"][
                      i % 4
                    ],
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
            <Link href="/zakoni/ustav">
              Отвори документ <ArrowUpRight size={14} />
            </Link>
          </div>
        </aside>
        <section className="explorer" aria-label="Истраживач закона">
          <div className="explorer-header">
            <div>
              <div className="eyebrow muted">БИБЛИОТЕКА ПРОПИСА</div>
              <h2>
                {searching
                  ? "Резултати претраге"
                  : category === "all"
                    ? "Велика слика вашег права"
                    : categoryLabel(category)}
              </h2>
              <p>
                {searching
                  ? `${matches.length} докумената · ${mode === "full" ? "претрага фразе у тексту" : "претрага назива и библиографских података"}`
                  : "Изаберите област и истражите законе који јој припадају."}
              </p>
            </div>
            <Tabs
              value={view}
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
          <Tabs
            value={scope}
            onValueChange={(v) => {
              setScope(String(v));
              setCategory("all");
              setPage(0);
            }}
          >
            <TabsList className="registry-scope" aria-label="Збирка">
              <TabsTrigger value="national">Домаћи закони</TabsTrigger>
              <TabsTrigger value="treaties">Потврђивање уговора</TabsTrigger>
              <TabsTrigger value="all">Сви закони</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="collection-bar">
            <span>
              <SlidersHorizontal size={14} />
              {matches.length} докумената
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
              records={visible}
              category={category}
              onCategory={chooseCategory}
              total={matches.length}
              page={currentPage}
              onPage={setPage}
            />
          ) : (
            <>
              <div className="law-list" aria-live="polite">
                {visible.length ? (
                  visible.map((r, i) => (
                    <Link
                      prefetch={false}
                      className="law-list-row"
                      href={lawPath(r.id)}
                      key={r.id}
                    >
                      <span className="law-index">
                        {currentPage * size + i + 1}
                      </span>
                      <BookOpen size={21} />
                      <div>
                        <h3>{r.title}</h3>
                        <p>{r.categories.map(categoryLabel).join(" · ")}</p>
                        <small>
                          {r.citation
                            .slice(r.title.length)
                            .replace(/^:\s*/, "")}{" "}
                          ·{" "}
                          {r.textStatus === "complete"
                            ? "Цео текст ПИС-а"
                            : r.sourceIssue
                              ? "Потребна провера извора"
                              : "Изворни PDF"}
                        </small>
                      </div>
                      <ArrowUpRight size={19} />
                    </Link>
                  ))
                ) : (
                  <div className="empty-state">
                    <Search size={30} />
                    <h3>Нема резултата у овој збирци.</h3>
                    <p>
                      Пробајте другу реч, претрагу целог текста или све законе.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery("");
                        setScope("all");
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
          <div className="source-banner">
            <Info size={18} />
            <div>
              <strong>
                {report.importedRecords.toLocaleString("sr-RS")} докумената ·
                искључиво ПИС
              </strong>
              <p>
                {report.fullTextRecords?.toLocaleString("sr-RS")} HTML текстова;{" "}
                {report.sourceOnlyRecords?.toLocaleString("sr-RS")} записа са
                везом ка извору, без локалног пуног текста. Сваки закон има
                један документ. Регистар обухвата и историјске акте који нису
                изричито укинути. Погледајте обухват и проверу извора.
              </p>
              {report.failures.length > 0 && (
                <p className="source-warning">
                  {report.failures.length} текстова није преузето. Обухват још
                  није потпун.
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
