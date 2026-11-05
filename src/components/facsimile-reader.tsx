"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Facsimile } from "@/lib/registry-types";

type Lease = {
  users: number;
  promise: Promise<PDFDocumentProxy>;
  destroy: () => Promise<void>;
  timer?: ReturnType<typeof setTimeout>;
};

// Release PDF parts after they scroll out of view, even for very long annexes.
class PdfPool {
  private entries = new Map<string, Lease>();
  acquire(url: string) {
    let entry = this.entries.get(url);
    if (!entry) {
      const task = import("pdfjs-dist").then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        return pdfjs.getDocument({
          url,
          cMapUrl: "/pdfjs/cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "/pdfjs/standard_fonts/",
          wasmUrl: "/pdfjs/wasm/",
          disableAutoFetch: true,
          disableStream: true,
        });
      });
      entry = {
        users: 0,
        promise: task.then((loading) => loading.promise),
        destroy: () => task.then((loading) => loading.destroy()),
      };
      this.entries.set(url, entry);
    }
    clearTimeout(entry.timer);
    entry.users++;
    return entry.promise;
  }
  release(url: string) {
    const entry = this.entries.get(url);
    if (!entry || --entry.users > 0) return;
    entry.timer = setTimeout(() => {
      this.entries.delete(url);
      void entry.destroy().catch(() => {});
    }, 500);
  }
}

function ScanPage({
  url,
  page,
  number,
  label,
  pool,
}: {
  url: string;
  page: number;
  number: number;
  label: string;
  pool: PdfPool;
}) {
  const wrapper = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const node = wrapper.current!;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "900px 0px" },
    );
    const resize = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    observer.observe(node);
    resize.observe(node);
    return () => {
      observer.disconnect();
      resize.disconnect();
    };
  }, []);
  useEffect(() => {
    const element = canvas.current;
    if (!visible || !width || !element) return;
    let cancelled = false;
    let render: RenderTask | undefined;
    pool
      .acquire(url)
      .then(async (pdf) => {
        if (cancelled) return;
        const source = await pdf.getPage(page);
        if (cancelled) return;
        const natural = source.getViewport({ scale: 1 });
        const density = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = source.getViewport({
          scale: (width / natural.width) * density,
        });
        element.width = Math.ceil(viewport.width);
        element.height = Math.ceil(viewport.height);
        wrapper.current?.style.setProperty(
          "--page-ratio",
          `${natural.width} / ${natural.height}`,
        );
        render = source.render({ canvas: element, viewport });
        await render.promise;
        if (!cancelled) setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      render?.cancel();
      pool.release(url);
      element.width = 0;
      element.height = 0;
    };
  }, [visible, width, url, page, pool]);
  return (
    <figure ref={wrapper} id={`scan-page-${number}`} className="scan-page">
      <figcaption>
        Страна скена {number} · {label}
      </figcaption>
      <div className="scan-paper">
        {error ? (
          <p role="alert">
            Страна није учитана.{" "}
            <a href={`${url}#page=${page}`} target="_blank" rel="noreferrer">
              Отвори локални PDF
            </a>
            .
          </p>
        ) : (
          <>
            <canvas ref={canvas} aria-label={`Факсимил: ${label}`} role="img" />
            {!loaded && visible && <p role="status">Учитавање стране…</p>}
          </>
        )}
      </div>
    </figure>
  );
}

export function FacsimileReader({ document }: { document: Facsimile }) {
  const [pool] = useState(() => new PdfPool());
  const [zoomed, setZoomed] = useState(false);
  const [target, setTarget] = useState("1");
  const pages = document.parts.flatMap((part) =>
    Array.from({ length: part.pages }, (_, index) => ({
      url: part.url,
      page: index + 1,
    })),
  );
  return (
    <section className="scan-reader" aria-label="Цео закон у факсимилу">
      <p className="educational-note">
        {document.coverage} Скен није обухваћен претрагом по тексту. OCR се не
        приказује као текст закона.
      </p>
      <div className="document-toolbar scan-toolbar">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const number = Math.min(
              pages.length,
              Math.max(1, Number(target) || 1),
            );
            setTarget(String(number));
            window.document
              .getElementById(`scan-page-${number}`)
              ?.scrollIntoView({ block: "start" });
          }}
        >
          <label htmlFor="scan-page-input">Страна скена</label>
          <Input
            id="scan-page-input"
            className="w-20"
            type="number"
            min={1}
            max={pages.length}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          />
          <span>од {pages.length}</span>
          <Button variant="outline" size="sm" type="submit">
            Иди
          </Button>
        </form>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={zoomed}
          onClick={() => setZoomed(!zoomed)}
        >
          {zoomed ? <ZoomOut /> : <ZoomIn />}
          {zoomed ? "Уклопи у ширину" : "Увећај приказ"}
        </Button>
      </div>
      <details className="scan-downloads">
        <summary>Преузми PDF за читање или штампу</summary>
        <div className="document-actions">
          {document.parts.map((part, index) => (
            <a
              key={part.url}
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href={part.url}
              download
            >
              <Download size={16} />
              {document.parts.length === 1
                ? "Преузми скен"
                : `Део ${index + 1} од ${document.parts.length}`}
            </a>
          ))}
        </div>
        {document.parts.length > 1 && (
          <p>
            Сви делови чине исти закон. Подељени су само PDF фајлови ради бржег
            учитавања.
          </p>
        )}
      </details>
      <div className={`scan-pages${zoomed ? " is-zoomed" : ""}`}>
        {pages.map((page, index) => (
          <ScanPage
            key={`${page.url}-${page.page}`}
            {...page}
            number={index + 1}
            label={document.pageLabels[index]}
            pool={pool}
          />
        ))}
      </div>
    </section>
  );
}
