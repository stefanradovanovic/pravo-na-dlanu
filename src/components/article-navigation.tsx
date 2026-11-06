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
import type { ArticleHeading } from "@/lib/document-navigation";
import { normalizeSearch } from "@/lib/search";

export function ArticleNavigation({
  headings,
}: {
  headings: ArticleHeading[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const [fontSize, setFontSize] = useState(17);
  const navigation = useRef<HTMLElement>(null);
  const selectedPosition = useRef<{ index: number; y: number } | null>(null);

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
      const offset = nav.offsetHeight + 24;
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
  }, [headings]);

  useEffect(() => {
    const reader = navigation.current?.closest<HTMLElement>(".full-document");
    reader?.style.setProperty("--reader-font-size", `${fontSize}px`);
    return () => {
      reader?.style.removeProperty("--reader-font-size");
    };
  }, [fontSize]);

  if (!headings.length) return null;
  const number = normalizeSearch(query)
    .replace(/^clan\s*/, "")
    .replaceAll(" ", "");
  const visible = headings.filter(
    (heading) => !number || heading.id.split("-")[1] === number,
  );
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
          `${nav.offsetHeight + 24}px`,
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
        <div
          className="reading-control-group"
          role="group"
          aria-label="Величина текста"
        >
          <Button
            variant="outline"
            size="icon"
            aria-label="Смањи текст"
            disabled={fontSize <= 15}
            onClick={() => setFontSize((size) => size - 2)}
          >
            <Minus />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Врати подразумевану величину текста"
            title="Врати подразумевану величину текста"
            onClick={() => setFontSize(17)}
          >
            {fontSize} px
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Увећај текст"
            disabled={fontSize >= 23}
            onClick={() => setFontSize((size) => size + 2)}
          >
            <Plus />
          </Button>
        </div>
      </div>
      <Accordion value={open} onValueChange={setOpen}>
        <AccordionItem value="contents">
          <AccordionTrigger>
            Садржај закона · {headings.length} чланова
          </AccordionTrigger>
          <AccordionContent>
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
                onChange={(event) => setQuery(event.target.value)}
                aria-describedby="article-jump-help"
              />
              <p id="article-jump-help" className="article-jump-help">
                Унесите број и притисните Enter, или изаберите члан испод.
              </p>
            </form>
            <ul>
              {visible.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    aria-current={
                      headings[active]?.id === heading.id
                        ? "location"
                        : undefined
                    }
                    onClick={(event) => follow(event, heading.id)}
                  >
                    {heading.label}
                  </a>
                </li>
              ))}
            </ul>
            {!visible.length && <p role="status">Нема члана са тим бројем.</p>}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </nav>
  );
}
