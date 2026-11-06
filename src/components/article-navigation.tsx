"use client";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
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
  const [activeId, setActiveId] = useState("");
  const desktopList = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const elements = headings.flatMap(({ id }) => {
      const element = document.getElementById(id);
      return element ? [element] : [];
    });
    let frame = 0;
    const update = () => {
      frame = 0;
      // Find the last article above the reading line, including long articles.
      let low = 0;
      let high = elements.length;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (elements[middle].getBoundingClientRect().top <= 120)
          low = middle + 1;
        else high = middle;
      }
      setActiveId(elements[Math.max(0, low - 1)]?.id ?? "");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [headings]);

  useEffect(() => {
    const list = desktopList.current;
    const link = list?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!list || !link) return;
    const bounds = list.getBoundingClientRect();
    const item = link.getBoundingClientRect();
    if (item.top < bounds.top || item.bottom > bounds.bottom) {
      list.scrollTop +=
        item.top - bounds.top - list.clientHeight / 2 + item.height / 2;
    }
  }, [activeId, query]);

  if (!headings.length) return null;
  const number = normalizeSearch(query)
    .replace(/^clan\s*/, "")
    .replaceAll(" ", "");
  const visible = headings.filter(
    (heading) => !number || heading.id.split("-")[1] === number,
  );
  const contents = (desktop: boolean) => (
    <>
      <label htmlFor={desktop ? "article-number-desktop" : "article-number"}>
        Иди на члан
      </label>
      <Input
        id={desktop ? "article-number-desktop" : "article-number"}
        placeholder="Број члана, нпр. 12 или 12а"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul ref={desktop ? desktopList : undefined}>
        {visible.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={activeId === heading.id ? "location" : undefined}
            >
              {heading.label}
            </a>
          </li>
        ))}
      </ul>
      {!visible.length && <p role="status">Нема члана са тим бројем.</p>}
    </>
  );
  return (
    <nav className="article-navigation" aria-label="Садржај закона">
      <div className="article-navigation-desktop">
        <h2>Садржај закона</h2>
        <p>{headings.length} чланова</p>
        {contents(true)}
      </div>
      <div className="article-navigation-mobile">
        <Accordion>
          <AccordionItem value="contents">
            <AccordionTrigger>
              Садржај закона · {headings.length} чланова
            </AccordionTrigger>
            <AccordionContent>{contents(false)}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </nav>
  );
}
