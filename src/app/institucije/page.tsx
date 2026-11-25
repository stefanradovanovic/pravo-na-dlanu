import type { Metadata } from "next";
import { getCourtDirectory } from "@/lib/court-directory";
import { institutionGroups } from "@/lib/institution-directory";
import { socialMetadata } from "@/lib/social-metadata";
import { InstitutionDirectory } from "./institution-directory";
import "./institutions.css";
import "./institution-directory.css";
import "./court-directory.css";

export const metadata: Metadata = {
  ...socialMetadata("/institucije"),
  title: "Мапа институција Србије",
  description:
    "Преглед институција Србије, са списковима министарстава и судова, њиховим надлежностима и везама ка прописима.",
};

export default function InstitutionsPage() {
  return (
    <main id="main" className="institution-page">
      <header className="institution-intro">
        <h1>Мапа институција Србије</h1>
      </header>
      <InstitutionDirectory
        groups={institutionGroups}
        courts={getCourtDirectory()}
      />
    </main>
  );
}
