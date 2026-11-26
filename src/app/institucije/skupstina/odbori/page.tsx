import { assemblyRulesSource } from "@/lib/assembly-map";
import data from "../../../../../content/assembly-directory.json";
import { AssemblyShell } from "../assembly-shell";
import { buttonVariants } from "@/components/ui/button";

import { siteMetadata } from "@/lib/social-metadata";

export const metadata = {
  ...siteMetadata("/institucije/skupstina/odbori"),
  title: "Одбори",
  description:
    "Преглед одбора Народне скупштине Србије, њихових надлежности и састава, са везама ка одговарајућим члановима Пословника.",
};
const members = new Map(data.members.map((member) => [member.id, member.name]));

export default function CommitteesPage() {
  return (
    <AssemblyShell
      title={metadata.title}
      description={`Број одбора: ${data.committees.length}`}
      accessedAt={data.accessedAt}
    >
      <div className="assembly-committees">
        {data.committees.map((committee) => (
          <article key={committee.article}>
            <h2>{committee.name}</h2>
            <p>{committee.summary}</p>
            <details>
              <summary
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Састав одбора ({committee.seats.length})
              </summary>
              <ul className="assembly-list">
                {committee.seats.map((seat) => (
                  <li key={seat.member}>
                    <a
                      className="text-link"
                      href={`/institucije/skupstina#poslanik-${seat.member}`}
                    >
                      {members.get(seat.member)}
                    </a>
                    <span>{seat.role}</span>
                  </li>
                ))}
              </ul>
              {committee.article !== 67 && (
                <p className="assembly-status">
                  У објављеном саставу председник одбора није означен.
                </p>
              )}
              {committee.article === 67 && (
                <a className="text-link" href={assemblyRulesSource(47).href}>
                  Председник по функцији · члан 47. Пословника
                </a>
              )}
            </details>
            <p className="assembly-links">
              <a className="text-link" href={committee.source}>
                Састав на сајту Скупштине
              </a>
              <a
                className="text-link"
                href={assemblyRulesSource(committee.article).href}
              >
                Пословник, члан {committee.article}.
              </a>
            </p>
          </article>
        ))}
      </div>
    </AssemblyShell>
  );
}
