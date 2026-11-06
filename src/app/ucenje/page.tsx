import type { Metadata } from "next";
import { Suspense } from "react";
import { LearningWorkspace } from "@/components/learning/learning-workspace";
import { getLearningCatalog } from "@/lib/learning-content";

export const metadata: Metadata = {
  title: "Учи и провери знање",
  description:
    "Упознајте своја права кроз кратке квизове, измишљене животне ситуације и читање званичних прописа.",
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
          Кратке вежбе о послу, личним подацима и односу са државом.
        </p>
        <ol className="learning-steps" aria-label="Како учимо">
          <li>01 · Ситуација</li>
          <li>02 · Ваш одговор</li>
          <li>03 · Објашњење</li>
          <li>04 · Извор</li>
        </ol>
      </div>
      <Suspense
        fallback={
          <div className="learning-workspace">
            <p role="status">Припремамо теме и вежбе…</p>
          </div>
        }
      >
        <LearningWorkspace catalog={catalog} />
      </Suspense>
    </main>
  );
}
