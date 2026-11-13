import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { ArrowUpRight, BookOpen, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { ReactNode } from "react";
import { ReaderControl, type ReaderControlProps } from "@/reader/controls";
import type { Facsimile } from "@/lib/registry-types";
import { FacsimileReader } from "./facsimile-reader";
import { categoryLabel, type RegistryRecord } from "@/lib/registry-types";
import { articleHeadings } from "@/lib/document-navigation";
import { getLawExamples } from "@/lib/learning-examples";
import { normalizeDocumentTitle } from "@/lib/document-presentation";
import { remarkArticleSubtitles } from "@/lib/article-subtitles";
const legalTextSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ["className", "article-subtitle"],
    ],
  },
};
export function FullLawDocument({
  record,
  markdown,
  renderControl = (props) => <ReaderControl {...props} />,
  renderScan = (document) => <FacsimileReader document={document} />,
}: {
  record: RegistryRecord;
  markdown: string;
  renderControl?: (props: ReaderControlProps) => ReactNode;
  renderScan?: (document: Facsimile) => ReactNode;
}) {
  const sourceOnly = record.textStatus === "source-only";
  const scan = record.textStatus === "facsimile" ? record.facsimile : undefined;
  const displayMarkdown = normalizeDocumentTitle(markdown, record.title);
  const headings = articleHeadings(displayMarkdown);
  const examples = getLawExamples(record.id, headings);
  const anchors = new Map(headings.map((heading) => [heading.line, heading]));
  const version = scan?.version ?? record.citation;
  const citation = version.startsWith(record.title)
    ? version.slice(record.title.length).replace(/^:\s*/, "")
    : version;
  return (
    <main id="main" className="reader full-document">
      <aside className="reader-sidebar">
        {renderControl({ kind: "back" })}
        {headings.length > 0 && renderControl({ kind: "navigation", headings })}
      </aside>
      <div className="reader-main">
        <div className="document-toolbar">
          <div className="document-breadcrumb">
            <BookOpen size={16} />
            <span>
              Прописи / {record.categories.map(categoryLabel).join(" · ")}
            </span>
          </div>
          <div className="document-tools">
            {!scan && !sourceOnly && renderControl({ kind: "settings" })}
            {renderControl({ kind: "actions", printable: !scan })}
          </div>
        </div>
        <div className="reader-heading">
          <div className="eyebrow">
            {record.documentType.toLocaleUpperCase("sr")}
          </div>
          <h1>{record.title}</h1>
          <div className="reader-meta">
            <span title="Правно-информациони систем Републике Србије">
              ПИС РС
            </span>
            <Badge variant="outline">
              {scan
                ? "Цео закон у факсимилу"
                : sourceOnly
                  ? record.sourceIssue
                    ? "Текст захтева проверу"
                    : "Извор у PDF издању"
                  : "Цео HTML текст ПИС-а"}
            </Badge>
            <span>
              Преузето{" "}
              {new Date(scan?.fetchedAt ?? record.fetchedAt).toLocaleDateString(
                "sr-RS",
                {
                  timeZone: "Europe/Belgrade",
                },
              )}
            </span>
          </div>
          <p className="source-version">{citation}</p>
        </div>
        <div className="source-banner">
          <Info size={18} />
          <div>
            <span className="sr-only">
              Правно-информациони систем Републике Србије
            </span>
            <small>
              {scan?.coverage ??
                record.sourceNote ??
                (sourceOnly
                  ? "Оригинално службено гласило може садржати више аката. Овај запис представља само наведени закон."
                  : "Пренет је цео доступни HTML текст ПИС-а, укључујући напомене извора. Прилози и слике остају на извору.")}{" "}
              Датум преузимања не представља правну потврду важења.
            </small>
          </div>
          <a
            href={scan?.sourceUrl ?? record.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Провери извор <ArrowUpRight size={14} />
          </a>
        </div>
        {examples && renderControl({ kind: "examples", ...examples })}
        {scan ? (
          renderScan(scan)
        ) : sourceOnly ? (
          <section className="pdf-source">
            <BookOpen size={32} />
            <h2>
              {record.sourceIssue
                ? "Текст још није доступан у збирци"
                : "Прочитајте закон у изворном издању"}
            </h2>
            <p>
              Засебан, поуздан текст закона још није преписан у нашу збирку и
              није обухваћен претрагом целог текста. Број после цртице у
              библиографској објави означава почетну штампану страну; број PDF
              стране може бити другачији.
            </p>
            <p>{record.citation}</p>
            <a
              className={buttonVariants({ variant: "default" })}
              href={record.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Отвори запис у ПИС-у <ArrowUpRight size={16} />
            </a>
          </section>
        ) : (
          <div className="law-reading-layout">
            <article
              id="tekst-zakona"
              className="legal-text complete-legal-text"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkArticleSubtitles]}
                rehypePlugins={[rehypeRaw, [rehypeSanitize, legalTextSchema]]}
                components={{
                  h2: ({ children, node }) => {
                    const heading = anchors.get(
                      node?.position?.start.line ?? -1,
                    );
                    return (
                      <h2 id={heading?.id} tabIndex={heading ? -1 : undefined}>
                        {heading && (
                          <a
                            className="article-permalink"
                            href={`#${heading.id}`}
                            aria-label={`Линк: ${heading.label}`}
                          >
                            #
                          </a>
                        )}
                        {children}
                      </h2>
                    );
                  },
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noreferrer">
                      {children}
                    </a>
                  ),
                  img: ({ alt, src }) => (
                    <a
                      href={typeof src === "string" ? src : record.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      [{alt || "Слика или графички прилог — отвори извор"}]
                    </a>
                  ),
                }}
              >
                {displayMarkdown}
              </ReactMarkdown>
            </article>
          </div>
        )}
        <div className="educational-note">
          <Info size={16} />
          <p>
            Текст извора је одвојен од наших објашњења. Измишљени примери служе
            учењу и нису правни савет.
          </p>
        </div>
      </div>
    </main>
  );
}
