import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { LearningWorkspace } from "@/components/learning/learning-workspace";
import { buttonVariants } from "@/components/ui/button";
import { getLearningCatalog } from "@/lib/learning-content";
import { socialMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = {
  ...socialMetadata("/ucenje"),
  title: "Учи и провери знање",
  description:
    "Потражите правни појам у Речнику или упознајте своја права кроз кратке вежбе и измишљене животне ситуације.",
};
export default function LearningPage() {
  const catalog = getLearningCatalog();
  return (
    <main id="main" className="learning-page">
      <div className="page-intro learning-intro">
        <div className="eyebrow">
          <span /> ПРАВО У СВАКОДНЕВНОМ ЖИВОТУ
        </div>
        <h1>
          Мала ситуација.
          <br />
          <span>Боље разумевање својих права.</span>
        </h1>
        <p>
          Размислите, изаберите одговор и откријте правило.
          <br />
          Кратке вежбе о Уставу, послу, куповини, подацима и јавној власти.
        </p>
        <ol className="learning-steps" aria-label="Како учимо">
          <li>01 · Ситуација</li>
          <li>02 · Ваш одговор</li>
          <li>03 · Објашњење</li>
          <li>04 · Извор</li>
        </ol>
      </div>
      <section
        className="learning-workspace learning-reference"
        aria-labelledby="learning-dictionary"
      >
        <div className="learning-orientation">
          <div>
            <h2 id="learning-dictionary">Речник</h2>
            <p>
              Објашњења правних и грађанских појмова, са примерима и изворима.
            </p>
          </div>
          <Link
            className={buttonVariants()}
            href="/ucenje/recnik"
            prefetch={false}
          >
            <BookOpen aria-hidden="true" /> Отвори речник
          </Link>
        </div>
      </section>
      <Suspense
        fallback={
          <div className="learning-workspace">
            <p role="status">Припремамо теме и вежбе…</p>
          </div>
        }
      >
        <LearningWorkspace catalog={catalog} />
      </Suspense>
      <noscript>
        <div className="learning-workspace">
          <p>
            За интерактивне вежбе потребан је JavaScript.{" "}
            <Link href="/vodic" className="text-link">
              Водич за читање закона
            </Link>{" "}
            и {/* Standalone laws use full document navigation. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/zakoni/ustav" className="text-link">
              цео текст Устава
            </a>{" "}
            доступни су и без њега.
          </p>
        </div>
      </noscript>
    </main>
  );
}
