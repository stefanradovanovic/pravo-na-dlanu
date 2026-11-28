import type { Metadata } from "next";
import { Suspense } from "react";
import { LearningWorkspace } from "@/components/learning/learning-workspace";
import { getLearningCatalog } from "@/lib/learning-content";
import { siteMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = {
  ...siteMetadata("/ucenje"),
  title: "Учи и провери знање",
  description:
    "Изаберите тему и упознајте своја права кроз кратке вежбе и измишљене животне ситуације.",
};
export default function LearningPage() {
  const catalog = getLearningCatalog();
  return (
    <main id="main" className="learning-page">
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
          <h1>Учење</h1>
          <p>
            За интерактивне вежбе потребан је JavaScript. Можете прочитати{" "}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/zakoni/ustav" className="text-link">
              цео текст Устава
            </a>
            .
          </p>
        </div>
      </noscript>
    </main>
  );
}
