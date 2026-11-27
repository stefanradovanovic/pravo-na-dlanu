import directory from "../../../../../content/assembly-directory.json";
import { siteMetadata } from "@/lib/social-metadata";
import { AssemblyShell } from "../assembly-shell";
import { RatingRanking } from "./rating-ranking";

export const metadata = {
  ...siteMetadata("/institucije/skupstina/rang-lista"),
  title: "Ранг-листа",
  description:
    "Ранг-листа народних посланика по укупном броју поена из оцена посетилаца.",
};

export default function AssemblyRankingPage() {
  return (
    <AssemblyShell
      title={metadata.title}
      description="Посланици по укупном броју поена"
      accessedAt={directory.accessedAt}
    >
      <RatingRanking
        term={directory.term}
        members={directory.members.map(({ id, name }) => ({ id, name }))}
      />
    </AssemblyShell>
  );
}
