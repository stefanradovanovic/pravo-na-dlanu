import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { ArrowUpRight, BookOpen, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DocumentActions } from "./document-actions";
import { FacsimileReader } from "./facsimile-reader";
import { categoryLabel, type RegistryRecord } from "@/lib/registry-types";
import { articleHeadings } from "@/lib/document-navigation";
import { ArticleNavigation } from "./article-navigation";
import { ReaderBackLink } from "./reader-back-link";
export function FullLawDocument({
  record,
  markdown,
}: {
  record: RegistryRecord;
  markdown: string;
}) {
  const sourceOnly = record.textStatus === "source-only";
  const scan = record.textStatus === "facsimile" ? record.facsimile : undefined;
  const headings = articleHeadings(markdown);
  const anchors = new Map(headings.map((heading) => [heading.line, heading]));
  return (
    <main id="main" className="reader full-document">
      <ReaderBackLink />
      <div className="reader-heading">
        <div className="eyebrow">
          {record.documentType.toLocaleUpperCase("sr")} · ЈЕДАН ДОКУМЕНТ
        </div>
        <h1>{record.title}</h1>
        <p>{record.categories.map(categoryLabel).join(" · ")}</p>
        <div className="reader-meta">
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
      </div>
      <div className="source-banner">
        <Info size={18} />
        <div>
          <strong>Правно-информациони систем Републике Србије</strong>
          <p>{scan?.version ?? record.citation}</p>
          <small>
            {scan?.coverage ??
              record.sourceNote ??
              (sourceOnly
                ? "Оригинално службено гласило може садржати више аката. Овај запис представља само наведени закон."
                : "Пренет је цео доступни HTML текст ПИС-а, укључујући напомене извора. Прилози и слике остају на извору.")}{" "}
            Датум преузимања не представља правну потврду важења.
          </small>
          {!!record.aliases?.length && (
            <small>
              Обједињено {record.aliases.length + 1} записа регистра који се
              односе на исти закон. Изворни подаци и разлози обједињавања
              сачувани су у извештају збирке.
            </small>
          )}
        </div>
        <a
          href={scan?.sourceUrl ?? record.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Провери извор <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="document-toolbar">
        <div>
          <BookOpen size={16} />
          <span>
            {scan
              ? "Непрекинут факсимил документа"
              : sourceOnly
                ? "Изворни запис ПИС-а"
                : "Непрекинут текст документа"}
          </span>
        </div>
        <DocumentActions printable={!scan} />
      </div>
      {scan ? (
        <FacsimileReader document={scan} />
      ) : sourceOnly ? (
        <section className="pdf-source">
          <BookOpen size={32} />
          <h2>
            {record.sourceIssue
              ? "Текст још није доступан у збирци"
              : "Прочитајте закон у изворном издању"}
          </h2>
          <p>
            Засебан, поуздан текст закона још није преписан у нашу збирку и није
            обухваћен претрагом целог текста. Број после цртице у библиографској
            објави означава почетну штампану страну; број PDF стране може бити
            другачији.
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
        <>
          <ArticleNavigation headings={headings} />
          <article id="tekst-zakona" className="legal-text complete-legal-text">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                h2: ({ children, node }) => {
                  const heading = anchors.get(node?.position?.start.line ?? -1);
                  return (
                    <h2 id={heading?.id} tabIndex={heading ? -1 : undefined}>
                      {children}
                      {heading && (
                        <a
                          className="article-permalink"
                          href={`#${heading.id}`}
                          aria-label={`Линк: ${heading.label}`}
                        >
                          #
                        </a>
                      )}
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
              {markdown}
            </ReactMarkdown>
          </article>
        </>
      )}
      <div className="educational-note">
        <Info size={16} />
        <p>
          Текст извора је одвојен од наших објашњења. Измишљени примери служе
          учењу и нису правни савет.
        </p>
        <Link href="/ucenje">
          Примери из живота <ArrowUpRight size={13} />
        </Link>
      </div>
    </main>
  );
}
