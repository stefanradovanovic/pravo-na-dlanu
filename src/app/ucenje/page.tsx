import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getLibrary } from "@/lib/content";
import { findLearningLaw } from "@/lib/registry";
import { ExampleCard } from "@/components/example-card";
export const metadata = { title: "Примери из живота" };
export default function LearningPage() {
  const library = getLibrary();
  const examples = library.articles.flatMap((article) =>
    article.examples.map((example) => ({
      article,
      example,
      law: library.laws.find((l) => l.id === article.lawId)!,
    })),
  );
  return (
    <main id="main" className="reader">
      <Link href="/" className="back-link">
        <ArrowLeft size={16} /> Назад на законе
      </Link>
      <div className="reader-heading">
        <div className="eyebrow">ОД ПРАВИЛА ДО ПРАКСЕ</div>
        <h1>А шта то значи за мене?</h1>
        <p>Прочитајте ситуацију, размислите и проверите своје разумевање.</p>
      </div>
      <div className="source-banner">
        <p>
          Измишљени примери за учење. Објашњења су машински припремљени
          уреднички нацрти, без стручне правне рецензије. Пример поједностављује
          околности и није одлука о одговорности стварне особе.
        </p>
      </div>
      <div className="examples-grid learning-examples">
        {examples.map((item, i) => {
          const source = findLearningLaw(item.law.id);
          return (
            <ExampleCard
              key={`${item.article.id}-${i}`}
              {...item}
              law={{
                ...item.law,
                ...(source
                  ? {
                      sourceUrl: source.sourceUrl,
                      sourceName: "Правно-информациони систем РС",
                      sourceVersion: source.citation,
                      sourceNote: undefined,
                    }
                  : {}),
              }}
              index={i}
            />
          );
        })}
      </div>
    </main>
  );
}
