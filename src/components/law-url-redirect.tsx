"use client";
import { useEffect } from "react";
import Link from "next/link";

/** Static hosting has no server redirects; preserve legacy query and article links. */
export function LawUrlRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(
      href + window.location.search + window.location.hash,
    );
  }, [href]);
  return (
    <main>
      <p>Пропис је премештен на читљиву адресу.</p>
      <Link href={href}>Отворите пропис →</Link>
    </main>
  );
}
