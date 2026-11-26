import data from "../../../../content/assembly-directory.json";
import { AssemblyShell } from "./assembly-shell";
import { MemberDirectory } from "./member-directory";

import { siteMetadata } from "@/lib/social-metadata";

export const metadata = {
  ...siteMetadata("/institucije/skupstina"),
  title: "Народни посланици",
  description:
    "Именик народних посланика Србије са посланичким групама, мапом седења у Великој сали и везама ка изворима Народне скупштине.",
};

export default function MembersPage() {
  return (
    <AssemblyShell
      title={metadata.title}
      description={`Број посланика: ${data.members.length}`}
      accessedAt={data.accessedAt}
    >
      <MemberDirectory members={data.members} groups={data.groups} />
      <p className="assembly-links">
        <a className="text-link" href={data.memberSource}>
          Скупштински именик посланика
        </a>
        <a className="text-link" href={data.groupSource}>
          Састав посланичких група
        </a>
      </p>
    </AssemblyShell>
  );
}
