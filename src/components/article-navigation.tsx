"use client";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ArticleHeading } from "@/lib/document-navigation";
import { normalizeSearch } from "@/lib/search";

export function ArticleNavigation({
  headings,
}: {
  headings: ArticleHeading[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(-1);
  const [desktop, setDesktop] = useState(true);
  const list = useRef<HTMLUListElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const selectedPosition = useRef<{ index: number; y: number } | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setDesktop(media.matches);
      setOpen(media.matches);
    };
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
      const offset = desktop
        ? 24
        : (nav.closest<HTMLElement>(".reader-sidebar")?.offsetHeight ??
            nav.offsetHeight) + 12;
      reader.style.setProperty("--reader-navigation-offset", `${offset}px`);
      const headerOffset =
        Number.parseFloat(
          getComputedStyle(document.documentElement).scrollPaddingTop,
        ) || 0;
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
          headerOffset + offset + 2
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

  if (!headings.length) return null;
  const number = normalizeSearch(query)
    .replace(/^clan\s*/, "")
    .replaceAll(" ", "");
  const visible = headings.filter(
    (heading) => !number || heading.id.split("-")[1] === number,
  );
  function jump(id: string) {
    if (!desktop) setOpen(false);
    requestAnimationFrame(() => {
      const nav = navigation.current;
      const target = document.getElementById(id);
      if (!nav || !target) return;
      nav
        .closest<HTMLElement>(".full-document")
        ?.style.setProperty(
          "--reader-navigation-offset",
          `${desktop ? 24 : (nav.closest<HTMLElement>(".reader-sidebar")?.offsetHeight ?? nav.offsetHeight) + 12}px`,
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
      </div>
      <h2 className="article-navigation-desktop">Садржај закона</h2>
      <details
        className="article-contents"
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary
          className="article-navigation-mobile"
          role="button"
          aria-expanded={open}
        >
          Садржај закона · {headings.length}{" "}
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="article-contents-body">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (number && visible.length === 1) {
                window.location.hash = visible[0].id;
                jump(visible[0].id);
              }
            }}
          >
            <label htmlFor="article-number">Иди на члан</label>
            <Input
              id="article-number"
              placeholder="Број члана, нпр. 12 или 12а"
              value={query}
              onValueChange={setQuery}
              aria-describedby="article-jump-help"
            />
            <p id="article-jump-help" className="article-jump-help">
              Унесите број и притисните Enter, или изаберите члан испод.
            </p>
          </form>
          <ul ref={list}>
            {visible.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  aria-label={heading.label}
                  aria-describedby={
                    heading.subtitle ? `toc-${heading.id}-caption` : undefined
                  }
                  aria-current={
                    headings[active]?.id === heading.id ? "location" : undefined
                  }
                  onClick={(event) => follow(event, heading.id)}
                >
                  <span>{heading.label}</span>
                  {heading.subtitle && (
                    <span
                      id={`toc-${heading.id}-caption`}
                      className="toc-subtitle"
                    >
                      {heading.subtitle}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
          {!visible.length && <p role="status">Нема члана са тим бројем.</p>}
        </div>
      </details>
    </nav>
  );
}
