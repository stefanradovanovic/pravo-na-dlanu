import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { institutionGroups } from "@/lib/institution-directory";
import { socialMetadata } from "@/lib/social-metadata";
import { InstitutionDirectory } from "./institution-directory";
import "./institutions.css";
import "./institution-directory.css";

export const metadata: Metadata = {
  ...socialMetadata("/institucije"),
  title: "Мапа институција Србије",
  description:
    "Преглед кључних институција и свих министарстава Србије, са надлежностима и везама ка прописима.",
};

export default function InstitutionsPage() {
  return (
    <main id="main" className="institution-page">
      <header className="institution-intro">
        <h1>Мапа институција Србије</h1>
        <nav aria-label="Садржај странице">
          <a href="#pregled-institucija" className={buttonVariants()}>
            Преглед институција
          </a>
        </nav>
      </header>
      <InstitutionDirectory groups={institutionGroups} />
    </main>
  );
}
