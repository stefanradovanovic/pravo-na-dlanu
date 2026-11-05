"use client";
import { useState } from "react";
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
  if (!headings.length) return null;
  const number = normalizeSearch(query)
    .replace(/^clan\s*/, "")
    .replaceAll(" ", "");
  const visible = headings.filter(
    (heading) => !number || heading.id.split("-")[1] === number,
  );
  return (
    <nav className="article-navigation" aria-label="Садржај закона">
      <Accordion>
        <AccordionItem value="contents">
          <AccordionTrigger>
            Садржај закона · {headings.length} чланова
          </AccordionTrigger>
          <AccordionContent>
            <label htmlFor="article-number">Иди на члан</label>
            <Input
              id="article-number"
              placeholder="Број члана, нпр. 12 или 12а"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <ul>
              {visible.map((heading) => (
                <li key={heading.id}>
                  <a href={`#${heading.id}`}>{heading.label}</a>
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
