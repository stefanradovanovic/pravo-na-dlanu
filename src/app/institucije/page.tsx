import type { Metadata } from "next";
import { institutionMaps } from "@/lib/institution-map";
import { socialMetadata } from "@/lib/social-metadata";
import { InstitutionExplorer } from "./institution-explorer";
import "./institutions.css";

export const metadata: Metadata = {
  ...socialMetadata("/institucije"),
  title: "Мапа институција Србије",
  description:
    "Истражите ко доноси одлуке, ко разматра жалбе и како су повезане институције у Србији.",
};

export default function InstitutionsPage() {
  return (
    <main id="main" className="institution-page">
      <header className="institution-intro">
        <h1>Мапа институција</h1>
      </header>
      <InstitutionExplorer maps={institutionMaps} />
      <p className="institution-note">
        Мапа је уредничко објашњење изабраних надлежности. Услове и изузетке
        прочитајте у изворима уз сваку везу.
      </p>
    </main>
  );
}
