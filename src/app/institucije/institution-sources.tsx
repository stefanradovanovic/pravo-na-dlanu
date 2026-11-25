import { BookOpen } from "lucide-react";
import type { InstitutionSource } from "@/lib/institution-map";

export function InstitutionSources({
  sources,
}: {
  sources: readonly InstitutionSource[];
}) {
  return (
    <ul className="institution-sources" aria-label="Извори">
      {sources.map((source) => (
        <li key={source.href}>
          <BookOpen size={15} aria-hidden="true" />
          <a className="text-link" href={source.href}>
            {source.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
