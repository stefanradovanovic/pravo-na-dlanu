"use client";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  filterArticleHeadings,
  type ArticleHeading,
} from "@/lib/document-navigation";
import { normalizeSearch } from "@/lib/search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ArticleNavigation({
  headings,
}: {
  headings: ArticleHeading[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const [fontSize, setFontSize] = useState(16);
  const [desktop, setDesktop] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const selectedPosition = useRef<{ index: number; y: number } | null>(null);
  const [bodyIndex, setBodyIndex] = useState<Map<string, string> | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const container = list.current;
    const link = container?.querySelector<HTMLElement>(
      '[aria-current="location"]',
    );
    if (!desktop || !container || !link) return;
    const bounds = container.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    if (item.top < bounds.top || item.bottom > bounds.bottom) {
      container.scrollTop +=
        item.top - bounds.top - container.clientHeight / 2 + item.height / 2;
    }
  }, [active, desktop, query]);

  useEffect(() => {
    const nav = navigation.current;
    const reader = nav?.closest<HTMLElement>(".full-document");
    if (!nav || !reader) return;
    const elements = headings.map((heading) =>
      document.getElementById(heading.id),
    );
    let frame = 0;
    const measure = () => {
      frame = 0;
      const offset = desktop ? 100 : nav.offsetHeight + 24;
      reader.style.setProperty("--reader-navigation-offset", `${offset}px`);
      // Near the end, a short article cannot always reach the top of the viewport.
      // Keep the explicitly selected article until the reader scrolls away.
      const selected = selectedPosition.current;
      if (selected && Math.abs(window.scrollY - selected.y) < 2) {
        setActive(selected.index);
        return;
      }
      selectedPosition.current = null;
      // Binary search keeps scrolling cheap even in laws with hundreds of articles.
      let low = 0;
      let high = elements.length - 1;
      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        if (
          (elements[middle]?.getBoundingClientRect().top ?? Infinity) <=
          offset + 2
        )
          low = middle + 1;
        else high = middle - 1;
      }
      setActive(high);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const followHash = () => {
      const index = headings.findIndex(
        (heading) => `#${heading.id}` === window.location.hash,
      );
      if (index >= 0 && elements[index]) {
        elements[index].scrollIntoView({ block: "start" });
        selectedPosition.current = { index, y: window.scrollY };
        schedule();
      }
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(nav);
    observer.observe(reader);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", followHash);
    frame = requestAnimationFrame(() => {
      measure();
      followHash();
    });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", followHash);
      reader.style.removeProperty("--reader-navigation-offset");
    };
  }, [headings, desktop]);

  useEffect(() => {
    const reader = navigation.current?.closest<HTMLElement>(".full-document");
    reader?.style.setProperty("--reader-font-size", `${fontSize}px`);
    reader?.style.setProperty("--reader-line-height", `${fontSize * 1.5}px`);
    return () => {
      reader?.style.removeProperty("--reader-font-size");
      reader?.style.removeProperty("--reader-line-height");
    };
  }, [fontSize]);

  if (!headings.length) return null;
  const number = normalizeSearch(query)
    .replace(/^clan\s*/, "")
    .replaceAll(" ", "");
  const visible = filterArticleHeadings(
    headings,
    query,
    bodyIndex ?? undefined,
  );
  const sections = headings.filter(
    (heading, index) =>
      heading.section && heading.section !== headings[index - 1]?.section,
  );
  function search(value: string) {
    // Read the existing legal text once, on demand; never serialize a second copy.
    if (!bodyIndex && value.trim()) {
      const index = new Map<string, string>();
      let id: string | undefined;
      let parts: string[] = [];
      for (const element of document.querySelector("#tekst-zakona")?.children ??
        []) {
        if (element.matches("h2[id]")) {
          if (id) index.set(id, normalizeSearch(parts.join(" ")));
          id = element.id;
          parts = [];
        }
        if (id) parts.push(element.textContent ?? "");
      }
      if (id) index.set(id, normalizeSearch(parts.join(" ")));
      setBodyIndex(index);
    }
    setQuery(value);
  }
  function jump(id: string) {
    setOpen([]);
    requestAnimationFrame(() => {
      const nav = navigation.current;
      const target = document.getElementById(id);
      if (!nav || !target) return;
      nav
        .closest<HTMLElement>(".full-document")
        ?.style.setProperty(
          "--reader-navigation-offset",
          `${desktop ? 100 : nav.offsetHeight + 24}px`,
        );
      target.scrollIntoView({ block: "start" });
      target.focus({ preventScroll: true });
      const index = headings.findIndex((heading) => heading.id === id);
      selectedPosition.current = { index, y: window.scrollY };
      setActive(index);
    });
  }
  function follow(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (
      event.button ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    // Keep native fragment history and modified-click behavior.
    jump(id);
  }
  const previous = headings[active - 1];
  const next = headings[active + 1];
  return (
    <nav
      ref={navigation}
      className="article-navigation"
      id="sadrzaj-zakona"
      aria-label="Садржај закона"
    >
      <div className="reading-controls">
        <span className="current-article" aria-label="Тренутни члан">
          {headings[active]?.label ?? "Почетак документа"}
        </span>
        <div
          className="reading-control-group"
          aria-label="Кретање по члановима"
        >
          {previous ? (
            <a
              className={buttonVariants({ variant: "outline", size: "icon" })}
              href={`#${previous.id}`}
              onClick={(event) => follow(event, previous.id)}
              aria-label="Претходни члан"
              title={`Претходни: ${previous.label}`}
            >
              <ArrowLeft />
            </a>
          ) : (
            <Button
              variant="outline"
              size="icon"
              disabled
              aria-label="Претходни члан"
            >
              <ArrowLeft />
            </Button>
          )}
          {next ? (
            <a
              className={buttonVariants({ variant: "outline", size: "icon" })}
              href={`#${next.id}`}
              onClick={(event) => follow(event, next.id)}
              aria-label="Следећи члан"
              title={`Следећи: ${next.label}`}
            >
              <ArrowRight />
            </a>
          ) : (
            <Button
              variant="outline"
              size="icon"
              disabled
              aria-label="Следећи члан"
            >
              <ArrowRight />
            </Button>
          )}
        </div>
        <div
          className="reading-control-group"
          role="group"
          aria-label="Величина текста"
        >
          <Button
            variant="outline"
            size="icon"
            aria-label="Смањи текст"
            disabled={fontSize <= 16}
            onClick={() => setFontSize((size) => size - 2)}
          >
            <Minus />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Врати подразумевану величину текста"
            title="Врати подразумевану величину текста"
            onClick={() => setFontSize(16)}
          >
            {fontSize} px
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Увећај текст"
            disabled={fontSize >= 24}
            onClick={() => setFontSize((size) => size + 2)}
          >
            <Plus />
          </Button>
        </div>
      </div>
      <h2 className="article-navigation-desktop">Садржај закона</h2>
      <Accordion value={desktop ? ["contents"] : open} onValueChange={setOpen}>
        <AccordionItem value="contents">
          <AccordionTrigger className="article-navigation-mobile">
            Садржај закона · {headings.length} чланова
          </AccordionTrigger>
          <AccordionContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (number && visible.length > 0) {
                  window.location.hash = visible[0].id;
                  jump(visible[0].id);
                }
              }}
            >
              <label htmlFor="article-number">Иди на члан</label>
              <Input
                id="article-number"
                placeholder="Број члана или речи у закону"
                value={query}
                onChange={(event) => search(event.target.value)}
                aria-describedby="article-jump-help"
              />
              <p id="article-jump-help" className="article-jump-help">
                Број (12, 12а) или речи, нпр. „одмор“. Enter отвара први
                резултат.
              </p>
            </form>
            {sections.length > 1 && (
              <div className="article-section-select">
                <label id="article-section-label">Одељак закона</label>
                <Select
                  value={null}
                  onValueChange={(id) => {
                    if (id) {
                      window.location.hash = id;
                      jump(id);
                    }
                  }}
                >
                  <SelectTrigger
                    aria-labelledby="article-section-label"
                    className="w-full"
                  >
                    <SelectValue placeholder="Изаберите одељак" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((heading) => (
                      <SelectItem key={heading.id} value={heading.id}>
                        <span className="whitespace-normal">
                          {heading.section}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {query && visible.length > 0 && (
              <p role="status" className="article-jump-help">
                Пронађено чланова: {visible.length}
              </p>
            )}
            <ul ref={list}>
              {visible.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    aria-label={heading.label}
                    aria-describedby={
                      heading.subtitle ? `nav-caption-${heading.id}` : undefined
                    }
                    aria-current={
                      headings[active]?.id === heading.id
                        ? "location"
                        : undefined
                    }
                    onClick={(event) => follow(event, heading.id)}
                  >
                    {heading.label}
                    {heading.subtitle && (
                      <span
                        id={`nav-caption-${heading.id}`}
                        className="article-nav-caption"
                      >
                        {heading.subtitle}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
            {!visible.length && (
              <p role="status">
                {/^\d+[a-z]*$/.test(number)
                  ? "Нема члана са тим бројем."
                  : "Нема чланова са тим речима. Пробајте краћу реч или број члана."}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </nav>
  );
}
