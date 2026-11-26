import type { Metadata } from "next";
import { getCourtDirectory } from "@/lib/court-directory";
import { institutionGroups } from "@/lib/institution-directory";
import { getProsecutionDirectory } from "@/lib/prosecution-directory";
import { siteMetadata } from "@/lib/social-metadata";
import { InstitutionDirectory } from "./institution-directory";
import "./institutions.css";
import "./institution-directory.css";
import "./court-directory.css";

export const metadata: Metadata = {
  ...siteMetadata("/institucije"),
  title: "Мапа институција Србије",
  description:
    "Преглед институција Србије, са списковима министарстава, судова и јавних тужилаштава, њиховим надлежностима и везама ка прописима.",
};

export default function InstitutionsPage() {
  const courts = getCourtDirectory();
  return (
    <main id="main" className="institution-page">
      <header className="institution-intro">
        <h1>Мапа институција Србије</h1>
      </header>
      <InstitutionDirectory
        groups={institutionGroups}
        courts={courts}
        prosecutions={getProsecutionDirectory(courts)}
      />
    </main>
  );
}
