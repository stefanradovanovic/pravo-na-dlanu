import type { Metadata } from "next";
import Link from "next/link";
import { GlossaryBrowser } from "@/components/learning/glossary-browser";
import { getGlossaryCatalog } from "@/lib/glossary-content";
import { socialMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = {
  ...socialMetadata("/ucenje/recnik"),
  title: "Речник правних и грађанских појмова",
  description:
    "Правни и грађански појмови објашњени једноставним језиком, са примерима и изворима.",
};

export default function GlossaryPage() {
  const { topics, sources } = getGlossaryCatalog();

  return (
    <main id="main" className="learning-page">
      <header className="page-intro learning-intro">
        <Link href="/ucenje" className="text-link">
          Учење
        </Link>
        <h1>Речник</h1>
        <p>Кратка уредничка објашњења правних и грађанских појмова.</p>
      </header>
      <GlossaryBrowser topics={topics} sources={sources} />
    </main>
  );
}
