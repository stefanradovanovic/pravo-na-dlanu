import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import {
  institutionGroups,
  institutionProcedures,
} from "@/lib/institution-directory";
import { institutionMaps } from "@/lib/institution-map";
import { socialMetadata } from "@/lib/social-metadata";
import { InstitutionDirectory } from "./institution-directory";
import { InstitutionExplorer } from "./institution-explorer";
import { InstitutionSources } from "./institution-sources";
import "./institutions.css";
import "./institution-directory.css";

export const metadata: Metadata = {
  ...socialMetadata("/institucije"),
  title: "Мапа институција Србије",
  description:
    "Преглед кључних институција и свих министарстава Србије, са надлежностима, изворима и мапама поступака.",
};

function InstitutionProcedures() {
  return (
    <section
      className="institution-procedures"
      aria-labelledby="zajednicki-postupci"
    >
      <header className="institution-section-heading">
        <h2 id="zajednicki-postupci" tabIndex={-1}>
          Како институције сарађују
        </h2>
      </header>
      <div className="institution-card-grid">
        {institutionProcedures.map((procedure) => (
          <article className="institution-flow" key={procedure.title}>
            <h3>{procedure.title}</h3>
            <ol>
              {procedure.steps.map((step) => (
                <li key={step.name}>
                  <strong>{step.name}</strong>
                  <span>{step.action}</span>
                  {step.detail && (
                    <p className="institution-flow-detail">{step.detail}</p>
                  )}
                </li>
              ))}
            </ol>
            {procedure.note && (
              <p className="institution-flow-note">{procedure.note}</p>
            )}
            <InstitutionSources sources={procedure.sources} />
          </article>
        ))}
      </div>
    </section>
  );
}

export default function InstitutionsPage() {
  return (
    <main id="main" className="institution-page">
      <header className="institution-intro">
        <h1>Мапа институција</h1>
        <p>Ко о чему одлучује у Србији?</p>
        <nav aria-label="Садржај странице">
          <a href="#pregled-institucija" className={buttonVariants()}>
            Преглед институција
          </a>
          <a
            href="#zajednicki-postupci"
            className={buttonVariants({ variant: "outline" })}
          >
            Како институције сарађују
          </a>
        </nav>
      </header>
      <InstitutionExplorer maps={institutionMaps} />
      <p className="institution-note">
        Мапа је уредничко објашњење изабраних надлежности. Услове и изузетке
        прочитајте у изворима уз сваку везу.
      </p>
      <InstitutionProcedures />
      <InstitutionDirectory groups={institutionGroups} />
    </main>
  );
}
