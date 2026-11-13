"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { readingTerms, searchReadingTerms } from "@/lib/reading-guide";

export function ReadingGlossary() {
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const terms = searchReadingTerms(query);

  return (
    <section
      id="recnik"
      className="guide-glossary"
      aria-labelledby="glossary-title"
    >
      <div className="guide-section-heading">
        <div>
          <span className="eyebrow">РЕЧИ КОЈЕ ЋЕТЕ СРЕСТИ</span>
          <h2 id="glossary-title">Мали речник за читање</h2>
          <p>Кратка објашњења за сналажење у документу и на сајту.</p>
        </div>
        <div className="guide-term-search">
          <label htmlFor="glossary-search">Пронађите појам</label>
          <div>
            <Search size={18} aria-hidden="true" />
            <Input
              id="glossary-search"
              ref={searchInput}
              value={query}
              onValueChange={setQuery}
              placeholder="Члан, верзија, примена…"
              aria-describedby="glossary-search-help"
            />
          </div>
          <small id="glossary-search-help">
            Ради и латиница, са или без квачица.
          </small>
        </div>
      </div>
      <p className="guide-search-status" role="status">
        Приказано {terms.length} од {readingTerms.length} појмова.
      </p>
      <dl className="guide-term-grid">
        {terms.map((term) => (
          <div key={term.id} id={`pojam-${term.id}`}>
            <dt>{term.title}</dt>
            <dd>{term.text}</dd>
          </div>
        ))}
      </dl>
      {terms.length === 0 && (
        <div className="guide-empty">
          <p>
            Нема појма за „{query}“. Пробајте краћу реч или погледајте цео
            речник.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              searchInput.current?.focus();
            }}
          >
            Прикажи све појмове
          </Button>
        </div>
      )}
    </section>
  );
}
