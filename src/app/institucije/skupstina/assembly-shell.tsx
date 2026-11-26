import type { ReactNode } from "react";
import { SourceAccessDate } from "../ministry-profile";
import "../institutions.css";
import "./assembly.css";

const root = "/institucije/skupstina";
const routes = [
  { name: "Народни посланици", href: root },
  { name: "Одбори", href: root + "/odbori" },
];

export function AssemblyShell({
  title,
  description,
  accessedAt,
  children,
}: {
  title: string;
  description: string;
  accessedAt: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className="institution-page assembly-page">
      <header className="institution-intro">
        <a
          className="text-link"
          href="/institucije#institucija-narodna-skupstina"
        >
          ← Народна скупштина
        </a>
        <h1>{title}</h1>
        <p>{description} · XV сазив</p>
      </header>
      <nav className="assembly-nav" aria-label="Састав Народне скупштине">
        {routes.map((route) => (
          <a
            className="text-link"
            key={route.href}
            href={route.href}
            aria-current={route.name === title ? "page" : undefined}
          >
            {route.name}
          </a>
        ))}
      </nav>
      {children}
      <footer>
        <SourceAccessDate accessedAt={accessedAt} />
      </footer>
    </main>
  );
}
